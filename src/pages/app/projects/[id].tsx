import HelpButton from '@/components/HelpButton';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChartColumn, FilePen, FileText, Layers, Receipt, ReceiptEuro, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { SkeletonForm } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import ProjectFields, { EMPTY_PROJECT, validateProject, type ProjectFormData } from '@/components/ProjectFields';
import { EXPENSE_STATUS, INVOICE_STATUS, PROJECT_STATUS, QUOTE_STATUS } from '@/lib/constants';
import { categoryLabel } from '@/lib/expenses';
import { formatCurrency, formatDate, getCustomerOptionLabel } from '@/lib/utils';
import type { Customer } from '@/lib/supabase';

type Tab = 'overzicht' | 'gegevens' | 'offertes' | 'facturen' | 'kosten' | 'notities';

/** Wat je aan een project kunt koppelen, met waar het in de API staat */
const KINDS: Record<'offertes' | 'facturen' | 'kosten' | 'notities', { api: string; title: string }> = {
  offertes: { api: 'quotes', title: 'Offerte koppelen' },
  facturen: { api: 'invoices', title: 'Factuur koppelen' },
  kosten: { api: 'expenses', title: 'Kosten koppelen' },
  notities: { api: 'notes', title: 'Notitie koppelen' },
};

interface ScheduleRow {
  id: number;
  label: string;
  percentage: number;
  amount: number;
  invoice: { id: number; invoice_number: string | null; status: string } | null;
}

/** Een termijn zoals hij in het venster staat: het percentage als tekst, zodat je vrij kunt typen */
interface ScheduleFormRow {
  id?: number;
  label: string;
  percentage: string;
  locked: boolean;
}

/** Zo begint een nieuw schema: de verdeling die in de bouw het meest voorkomt */
const DEFAULT_SCHEDULE: ScheduleFormRow[] = [
  { label: 'Bij opdracht', percentage: '30', locked: false },
  { label: 'Halverwege', percentage: '50', locked: false },
  { label: 'Bij oplevering', percentage: '20', locked: false },
];

interface Overview {
  project: any;
  schedule: ScheduleRow[];
  scheduleQuote: { id: number; quote_number: string; status: string } | null;
  quotes: any[];
  invoices: any[];
  expenses: any[];
  notes: any[];
  totals: { quoted: number; invoiced: number; costs: number; margin: number };
  progress: { quote_id: number; quote_number: string; base: number; billed: number; percentage: number }[];
}

/**
 * Eén project: links de onderdelen, rechts de inhoud. Het overzicht toont
 * wat er geoffreerd, gefactureerd en uitgegeven is, met de marge, en per
 * goedgekeurde offerte de termijnen. Opgezet zoals Klant bewerken.
 */
export default function ProjectPage() {
  const toast = useToast();
  const router = useRouter();
  const { id } = router.query;
  const { confirm } = useConfirm();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>(EMPTY_PROJECT);
  const [tab, setTab] = useState<Tab>('overzicht');
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Het termijnschema bewerken: over welke offerte, en de termijnen
  const [schedule, setSchedule] = useState<{ quoteId: string; rows: ScheduleFormRow[] } | null>(null);
  const [invoicing, setInvoicing] = useState<number | null>(null);
  // Iets bestaands koppelen
  const [linking, setLinking] = useState<keyof typeof KINDS | null>(null);
  const [linkOptions, setLinkOptions] = useState<{ value: string; label: string }[]>([]);
  const [linkValue, setLinkValue] = useState('');

  const load = async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) {
      toast.error('Fout', 'Project niet gevonden');
      return;
    }
    const data: Overview = await res.json();
    setOverview(data);
    const p = data.project;
    setFormData({
      name: p.name,
      customer_id: p.customer_id ? String(p.customer_id) : '',
      status: p.status,
      address: p.address || '',
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      description: p.description || '',
    });
  };

  useEffect(() => {
    if (!id) return;
    load();
    fetch('/api/customers')
      .then(res => (res.ok ? res.json() : []))
      .then(setCustomers)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setShowErrors(true);
    if (Object.keys(validateProject(formData)).length > 0) {
      toast.error('Nog niet compleet', 'Vul de gemarkeerde velden in');
      return;
    }
    setSaving(true);
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error('Fout', data.error || 'Er is iets misgegaan');
      return;
    }
    toast.success('Opgeslagen', 'Het project is bijgewerkt');
    load();
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Project verwijderen',
      message: 'Weet je zeker dat je dit project wilt verwijderen? De offertes, facturen, kosten en notities blijven bestaan, alleen zonder project.',
      confirmText: 'Verwijderen',
      negative: true,
      cancelText: 'Annuleren',
    });
    if (!confirmed) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    router.push('/app/projects');
  };

  /** Opent het schema: het bestaande, of een voorstel van 30, 50 en 20% */
  const openSchedule = () => {
    if (!overview) return;
    const quotes = overview.quotes;
    const approved = quotes.find(q => q.status === 'approved');
    setSchedule({
      quoteId: String(overview.scheduleQuote?.id || approved?.id || quotes[0]?.id || ''),
      rows: overview.schedule.length
        ? overview.schedule.map(row => ({ id: row.id, label: row.label, percentage: String(row.percentage), locked: !!row.invoice }))
        : DEFAULT_SCHEDULE.map(row => ({ ...row })),
    });
  };

  const saveSchedule = async () => {
    if (!schedule) return;
    const response = await fetch(`/api/projects/${id}/installments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId: Number(schedule.quoteId),
        rows: schedule.rows.map(row => ({ id: row.id, label: row.label, percentage: Number(row.percentage.replace(',', '.')) })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error('Fout', data.error || 'De termijnen konden niet worden opgeslagen');
      return;
    }
    setSchedule(null);
    toast.success('Opgeslagen', 'Het termijnschema staat klaar');
    load();
  };

  /** Eén termijn factureren: een concept, en dan meteen naar die factuur */
  const handleInvoiceInstallment = async (installmentId: number) => {
    setInvoicing(installmentId);
    const response = await fetch(`/api/projects/${id}/installments/${installmentId}`, { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error('Fout', data.error || 'De termijnfactuur kon niet gemaakt worden');
      setInvoicing(null);
      return;
    }
    router.push(`/app/invoices/${data.id}`);
  };

  /** Opent het koppelvenster met wat nog bij geen enkel project hoort */
  const openLink = async (kind: keyof typeof KINDS) => {
    setLinking(kind);
    setLinkValue('');
    const items: any[] = await fetch(`/api/${KINDS[kind].api}`).then(res => (res.ok ? res.json() : [])).catch(() => []);
    setLinkOptions(
      items
        .filter(item => !item.project_id)
        .map(item => ({
          value: String(item.id),
          label:
            kind === 'offertes' ? `${item.quote_number} · ${formatCurrency(item.total)}`
              : kind === 'facturen' ? `${item.invoice_number || 'Concept'} · ${formatCurrency(item.total)}`
                : kind === 'kosten' ? `${item.supplier} · ${formatDate(item.expense_date)} · ${formatCurrency(item.total)}`
                  : item.title,
        }))
    );
  };

  const handleLink = async () => {
    if (!linking || !linkValue) return;
    const response = await fetch(`/api/${KINDS[linking].api}/${linkValue}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: Number(id) }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error('Fout', data.error || 'Koppelen mislukt');
      return;
    }
    setLinking(null);
    toast.success('Gekoppeld', 'Het hoort nu bij dit project');
    load();
  };

  if (!overview) {
    return (
      <Layout title="Project">
        <div className="header">
          <h1>Project</h1>
        </div>
        <SkeletonForm />
      </Layout>
    );
  }

  const { project, totals } = overview;
  const customerQuery = project.customer_id ? `&customer_id=${project.customer_id}` : '';
  const customerOptions = customers.map(c => ({ value: String(c.id), label: getCustomerOptionLabel(c) }));
  const scheduleTotal = schedule ? schedule.rows.reduce((sum, row) => sum + (Number(row.percentage.replace(',', '.')) || 0), 0) : 0;
  const canInvoice = overview.scheduleQuote?.status === 'approved';

  const navigation: { key: Tab; label: string; icon: typeof Layers; count?: number }[] = [
    { key: 'overzicht', label: 'Overzicht', icon: ChartColumn },
    { key: 'gegevens', label: 'Gegevens', icon: Layers },
    { key: 'offertes', label: 'Offertes', icon: FileText, count: overview.quotes.length },
    { key: 'facturen', label: 'Facturen', icon: ReceiptEuro, count: overview.invoices.length },
    { key: 'kosten', label: 'Kosten', icon: Receipt, count: overview.expenses.length },
    { key: 'notities', label: 'Notities', icon: FilePen, count: overview.notes.length },
  ];

  /** De knoppen boven een lijst: iets nieuws maken met dit project, of iets bestaands koppelen */
  const listActions = (kind: keyof typeof KINDS, href: string, label: string) => (
    <div className="actions">
      <button type="button" className="button cancel" onClick={() => openLink(kind)}>
        Koppelen
      </button>
      <Link href={href} className="button">
        {label}
      </Link>
    </div>
  );

  return (
    <Layout title={project.name}>
      <div className="header">
        <h1>
          {project.name} <HelpButton topic="projects" />
        </h1>
        <div className="actions">
          <span className={`status-badge ${PROJECT_STATUS[project.status]?.className || ''}`}>
            {PROJECT_STATUS[project.status]?.label}
          </span>
          <button type="button" className="button" onClick={() => router.push('/app/projects')}>
            Terug
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="block page-navigation">
          <nav>
            <span className="section-title">Project</span>
            {navigation.map(({ key, label, icon: Icon, count }) => (
              <Link
                key={key}
                href={`#${key}`}
                className={tab === key ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  setTab(key);
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
                {count ? <span className="placeholder">{count}</span> : null}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          {tab === 'overzicht' && (
            <>
              <div className="grid four">
                {[
                  { label: 'Geoffreerd', value: totals.quoted, note: 'Goedgekeurde offertes, excl. btw' },
                  { label: 'Gefactureerd', value: totals.invoiced, note: 'Verstuurde facturen, excl. btw' },
                  { label: 'Kosten', value: totals.costs, note: 'Bonnen en inkoopfacturen, excl. btw' },
                  { label: 'Marge', value: totals.margin, note: 'Gefactureerd min kosten', negative: totals.margin < 0 },
                ].map((stat) => (
                  <div key={stat.label} className={`block stat ${stat.negative ? 'negative' : ''}`}>
                    <span className="label">{stat.label}</span>
                    <div className="value">{formatCurrency(stat.value)}</div>
                    <div className="note">{stat.note}</div>
                  </div>
                ))}
              </div>

              <div className="grid">
                <div className="block">
                  <div className="header">
                    <h2>Termijnen</h2>
                    {overview.quotes.length > 0 && (
                      <button type="button" className="button cancel" onClick={openSchedule}>
                        {overview.schedule.length ? 'Termijnen wijzigen' : 'Termijnen vastleggen'}
                      </button>
                    )}
                  </div>
                  {overview.quotes.length === 0 ? (
                    <div className="empty-state">
                      <h3>Nog geen offerte bij dit project</h3>
                      <p>Maak eerst een offerte bij dit project; daarna leg je hier vast in welke termijnen je hem factureert.</p>
                    </div>
                  ) : overview.schedule.length === 0 ? (
                    <div className="empty-state">
                      <h3>Nog geen termijnen</h3>
                      <p>Leg vast in welke delen je de offerte factureert, zoals 30% bij opdracht, 50% halverwege en 20% bij oplevering.</p>
                    </div>
                  ) : (
                    <>
                      {!canInvoice && overview.scheduleQuote && (
                        <p className="field-note">
                          Offerte {overview.scheduleQuote.quote_number} is nog niet goedgekeurd. Factureren kan zodra de klant
                          tekent, of als je hem zelf op Goedgekeurd zet.
                        </p>
                      )}
                      <Table headers={['Termijn', 'Deel', 'Bedrag excl. btw', 'Status', '']}>
                        {overview.schedule.map((row) => (
                          <tr key={row.id}>
                            <td>{row.label}</td>
                            <td>{row.percentage}%</td>
                            <td>{formatCurrency(row.amount)}</td>
                            <td>
                              {row.invoice ? (
                                <span className={`status-badge ${INVOICE_STATUS[row.invoice.status]?.className || ''}`}>
                                  {INVOICE_STATUS[row.invoice.status]?.label || row.invoice.status}
                                </span>
                              ) : (
                                <span className="status-badge status-draft">Te factureren</span>
                              )}
                            </td>
                            <td className="actions">
                              {row.invoice ? (
                                <Link href={`/app/invoices/${row.invoice.id}`}>{row.invoice.invoice_number || 'Bekijken'}</Link>
                              ) : (
                                <button
                                  type="button"
                                  className="button cancel"
                                  onClick={() => handleInvoiceInstallment(row.id)}
                                  disabled={!canInvoice || invoicing !== null}
                                >
                                  {invoicing === row.id ? 'Bezig...' : 'Factureren'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </Table>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'gegevens' && (
            <div className="block">
              <div className="header">
                <h2>Gegevens</h2>
                <div className="actions">
                  <button type="button" className="button negative" onClick={handleDelete}>
                    Verwijderen
                  </button>
                  <button type="button" className="button" onClick={handleSave} disabled={saving}>
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </div>
              <ProjectFields
                formData={formData}
                onChange={setFormData}
                customerOptions={customerOptions}
                errors={showErrors ? validateProject(formData) : {}}
              />
            </div>
          )}

          {tab === 'offertes' && (
            <div className="block">
              <div className="header">
                <h2>Offertes</h2>
                {listActions('offertes', `/app/quotes/new?project_id=${project.id}${customerQuery}`, 'Offerte maken')}
              </div>
              {overview.quotes.length === 0 ? (
                <div className="empty-state">
                  <p>Nog geen offertes bij dit project.</p>
                </div>
              ) : (
                <Table headers={['Offerte #', 'Datum', 'Excl. btw', 'Totaal', 'Status']}>
                  {overview.quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td>
                        <Link href={`/app/quotes/${quote.id}`}>{quote.quote_number}</Link>
                      </td>
                      <td>{formatDate(quote.quote_date)}</td>
                      <td>{formatCurrency(quote.base)}</td>
                      <td>{formatCurrency(quote.total)}</td>
                      <td>
                        <span className={`status-badge ${QUOTE_STATUS[quote.status]?.className || ''}`}>
                          {QUOTE_STATUS[quote.status]?.label || quote.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          )}

          {tab === 'facturen' && (
            <div className="block">
              <div className="header">
                <h2>Facturen</h2>
                {listActions('facturen', `/app/invoices/new?project_id=${project.id}${customerQuery}`, 'Factuur maken')}
              </div>
              {overview.invoices.length === 0 ? (
                <div className="empty-state">
                  <p>Nog geen facturen bij dit project.</p>
                </div>
              ) : (
                <Table headers={['Factuur #', 'Datum', 'Excl. btw', 'Totaal', 'Status']}>
                  {overview.invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <Link href={`/app/invoices/${invoice.id}`}>{invoice.invoice_number || 'Concept'}</Link>
                        {invoice.credit_for_invoice_id && <span className="placeholder"> · Credit</span>}
                      </td>
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td>{formatCurrency(invoice.base)}</td>
                      <td>{formatCurrency(invoice.total)}</td>
                      <td>
                        <span className={`status-badge ${INVOICE_STATUS[invoice.status]?.className || ''}`}>
                          {INVOICE_STATUS[invoice.status]?.label || invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          )}

          {tab === 'kosten' && (
            <div className="block">
              <div className="header">
                <h2>Kosten</h2>
                {listActions('kosten', `/app/expenses/new?project_id=${project.id}`, 'Kosten toevoegen')}
              </div>
              {overview.expenses.length === 0 ? (
                <div className="empty-state">
                  <p>Nog geen kosten bij dit project.</p>
                </div>
              ) : (
                <Table headers={['Leverancier', 'Datum', 'Categorie', 'Excl. btw', 'Status']}>
                  {overview.expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <Link href={`/app/expenses/${expense.id}`}>{expense.supplier}</Link>
                      </td>
                      <td>{formatDate(expense.expense_date)}</td>
                      <td>{categoryLabel(expense.category)}</td>
                      <td>{formatCurrency(Number(expense.total_excl))}</td>
                      <td>
                        <span className={`status-badge ${EXPENSE_STATUS[expense.status]?.className || ''}`}>
                          {EXPENSE_STATUS[expense.status]?.label || expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          )}

          {tab === 'notities' && (
            <div className="block">
              <div className="header">
                <h2>Notities</h2>
                {listActions('notities', `/app/notes/new?project_id=${project.id}${customerQuery}`, 'Notitie toevoegen')}
              </div>
              {overview.notes.length === 0 ? (
                <div className="empty-state">
                  <p>Nog geen notities bij dit project.</p>
                </div>
              ) : (
                <Table headers={['Notitie', 'Laatst bewerkt']}>
                  {overview.notes.map((note) => (
                    <tr key={note.id}>
                      <td className="note-cell">
                        <Link href={`/app/notes/${note.id}`} className="title">
                          {note.title}
                        </Link>
                      </td>
                      <td>{formatDate(note.updated_at || note.created_at)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!schedule} onClose={() => setSchedule(null)} title="Termijnen">
        {schedule && (
          <>
            <div className="form-section">
              <div className="form-group">
                <label>Offerte</label>
                <Select
                  value={overview.quotes.map(q => ({ value: String(q.id), label: `${q.quote_number} · ${formatCurrency(q.base)} excl. btw` })).find(o => o.value === schedule.quoteId) || null}
                  onChange={(option) => setSchedule({ ...schedule, quoteId: option?.value || '' })}
                  options={overview.quotes.map(q => ({ value: String(q.id), label: `${q.quote_number} · ${formatCurrency(q.base)} excl. btw` }))}
                />
              </div>
              {schedule.rows.map((row, index) => (
                <div key={index} className="form-row">
                  <div className="form-group">
                    {index === 0 && <label>Termijn</label>}
                    <input
                      type="text"
                      value={row.label}
                      disabled={row.locked}
                      aria-label="Omschrijving van de termijn"
                      onChange={(e) => setSchedule({ ...schedule, rows: schedule.rows.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)) })}
                      placeholder="Bijvoorbeeld: Bij opdracht"
                    />
                  </div>
                  <div className="form-group">
                    {index === 0 && <label>Percentage</label>}
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={row.percentage}
                      disabled={row.locked}
                      aria-label="Percentage"
                      onChange={(e) => setSchedule({ ...schedule, rows: schedule.rows.map((r, i) => (i === index ? { ...r, percentage: e.target.value } : r)) })}
                      placeholder="30"
                    />
                  </div>
                  {!row.locked && schedule.rows.length > 1 && (
                    <button
                      type="button"
                      className="button icon"
                      aria-label="Termijn verwijderen"
                      title="Termijn verwijderen"
                      onClick={() => setSchedule({ ...schedule, rows: schedule.rows.filter((_, i) => i !== index) })}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <div className="form-row">
                <button
                  type="button"
                  className="button cancel"
                  onClick={() => setSchedule({ ...schedule, rows: [...schedule.rows, { label: '', percentage: '', locked: false }] })}
                >
                  Termijn toevoegen
                </button>
              </div>
            </div>
            <p className="field-note">
              Samen {Math.round(scheduleTotal * 100) / 100}% {Math.abs(scheduleTotal - 100) > 0.01 ? '; dat moet 100% zijn.' : 'van de offerte.'}{' '}
              Termijnen die al gefactureerd zijn, blijven zoals ze zijn.
            </p>
            <div className="buttons">
              <button type="button" className="button cancel" onClick={() => setSchedule(null)}>
                Annuleren
              </button>
              <button type="button" className="button" onClick={saveSchedule} disabled={!schedule.quoteId || Math.abs(scheduleTotal - 100) > 0.01}>
                Opslaan
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={!!linking} onClose={() => setLinking(null)} title={linking ? KINDS[linking].title : ''}>
        <div className="form-section">
          <div className="form-group">
            <label>Kies wat erbij hoort</label>
            <Select
              value={linkOptions.find(o => o.value === linkValue) || null}
              onChange={(option) => setLinkValue(option?.value || '')}
              options={linkOptions}
              placeholder={linkOptions.length ? 'Selecteer' : 'Alles hoort al bij een project'}
            />
          </div>
        </div>
        <div className="buttons">
          <button type="button" className="button cancel" onClick={() => setLinking(null)}>
            Annuleren
          </button>
          <button type="button" className="button" onClick={handleLink} disabled={!linkValue}>
            Koppelen
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
