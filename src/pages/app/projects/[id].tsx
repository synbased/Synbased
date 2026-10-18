import HelpButton from '@/components/HelpButton';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChartColumn, FilePen, FileText, Layers, Receipt, ReceiptEuro } from 'lucide-react';
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

interface Overview {
  project: any;
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

  // De termijnfactuur: welke offerte, hoeveel procent en hoe hij heet
  const [installment, setInstallment] = useState<{ quoteId: string; percentage: string; label: string } | null>(null);
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

  /** Een termijnfactuur als concept, en dan meteen naar die factuur */
  const handleInstallment = async () => {
    if (!installment) return;
    const response = await fetch(`/api/projects/${id}/installment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId: Number(installment.quoteId),
        percentage: Number(installment.percentage.replace(',', '.')),
        label: installment.label,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error('Fout', data.error || 'De termijnfactuur kon niet gemaakt worden');
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

  const { project, totals, progress } = overview;
  const customerQuery = project.customer_id ? `&customer_id=${project.customer_id}` : '';
  const customerOptions = customers.map(c => ({ value: String(c.id), label: getCustomerOptionLabel(c) }));
  const approvedQuotes = progress.filter(p => p.percentage < 100);

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
          {approvedQuotes.length > 0 && (
            <button
              type="button"
              className="button cancel"
              onClick={() =>
                setInstallment({ quoteId: String(approvedQuotes[0].quote_id), percentage: '', label: `Termijn ${overview.invoices.filter(i => i.quote_id).length + 1}` })
              }
            >
              Termijnfactuur maken
            </button>
          )}
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

              <div className="block">
                <div className="header">
                  <h2>Termijnen</h2>
                </div>
                {progress.length === 0 ? (
                  <div className="empty-state">
                    <h3>Nog geen goedgekeurde offerte</h3>
                    <p>Is de offerte van dit project getekend, dan factureer je hier in termijnen, zoals 30% vooraf.</p>
                  </div>
                ) : (
                  <Table headers={['Offerte', 'Offertebedrag', 'Gefactureerd', 'Voortgang']}>
                    {progress.map((row) => (
                      <tr key={row.quote_id}>
                        <td>
                          <Link href={`/app/quotes/${row.quote_id}`}>{row.quote_number}</Link>
                        </td>
                        <td>{formatCurrency(row.base)}</td>
                        <td>{formatCurrency(row.billed)}</td>
                        <td>
                          <span className={`status-badge ${row.percentage >= 100 ? 'status-paid' : 'status-sent'}`}>
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
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

      <Modal isOpen={!!installment} onClose={() => setInstallment(null)} title="Termijnfactuur maken">
        {installment && (
          <>
            <div className="form-section">
              <div className="form-group">
                <label>Offerte</label>
                <Select
                  value={approvedQuotes.map(q => ({ value: String(q.quote_id), label: `${q.quote_number} · al ${q.percentage}% gefactureerd` })).find(o => o.value === installment.quoteId) || null}
                  onChange={(option) => setInstallment({ ...installment, quoteId: option?.value || '' })}
                  options={approvedQuotes.map(q => ({ value: String(q.quote_id), label: `${q.quote_number} · al ${q.percentage}% gefactureerd` }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="installment-label">Omschrijving</label>
                  <input
                    id="installment-label"
                    type="text"
                    value={installment.label}
                    onChange={(e) => setInstallment({ ...installment, label: e.target.value })}
                    placeholder="Bijvoorbeeld: Termijn 1, bij opdracht"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="installment-percentage">Percentage</label>
                  <input
                    id="installment-percentage"
                    type="number"
                    min={1}
                    max={100}
                    value={installment.percentage}
                    onChange={(e) => setInstallment({ ...installment, percentage: e.target.value })}
                    placeholder="Bijvoorbeeld 30"
                  />
                </div>
              </div>
            </div>
            <p className="field-note">
              Elke prijstabel van de offerte komt er als één regel op, met hetzelfde btw-tarief. Je krijgt een concept om
              na te kijken voor je hem verstuurt.
            </p>
            <div className="buttons">
              <button type="button" className="button cancel" onClick={() => setInstallment(null)}>
                Annuleren
              </button>
              <button type="button" className="button" onClick={handleInstallment} disabled={!installment.quoteId || !installment.percentage}>
                Factuur maken
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
