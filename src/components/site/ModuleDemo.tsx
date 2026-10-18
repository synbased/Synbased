import { createContext, Fragment, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  X,
  ChartColumn,
  CircleCheck,
  FilePen,
  FileText,
  Inbox,
  Landmark,
  LayoutDashboard,
  MousePointer2,
  Package,
  Percent,
  Receipt,
  ReceiptEuro,
  Settings,
  Upload,
  Users,
  CalendarDays,
} from 'lucide-react';
import { GoogleIcon, MicrosoftIcon, MollieIcon } from '@/components/BrandIcons';
import type { SiteModule } from './modules';

/**
 * Het demoblok op de pagina van een module: links de stappen, rechts een
 * verkleinde Synbased die laat zien wat er gebeurt. De schermen zijn gebouwd
 * met de echte classes van de app (zijbalk, kop, tabellen, statuslabels,
 * stat-tegels, vensters en meldingen uit globals.css), zodat het eruitziet
 * zoals de app zelf. Per stap loopt een tijdlijn: tekst wordt getypt, regels
 * verschijnen, de cursor klikt en er komt een melding.
 */

/** Zo breed is de app in het venster; daarna wordt hij passend verkleind */
const BASE_WIDTH = 1000;

/** Zo hoog is de app; het venster schaalt mee */
const APP_HEIGHT = 766;

/** Zo lang staat elke stap, voor hij doorschuift */
const STEP_MS = 7500;

const DemoTime = createContext<{ t: number; root: HTMLDivElement | null }>({ t: 0, root: null });

/**
 * Waar een element in de app staat, in de maten van de app zelf. Via
 * offsetLeft en offsetTop, want die veranderen niet als de app verkleind of
 * door de camera ingezoomd is.
 */
function positionIn(element: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, width: element.offsetWidth, height: element.offsetHeight };
}
const useT = () => useContext(DemoTime).t;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

/** Tekst die vanaf een moment letter voor letter verschijnt */
const typed = (text: string, t: number, start: number, perSecond = 24) =>
  text.slice(0, Math.max(0, Math.floor((t - start) * perSecond)));

/** Wanneer het typen van een tekst klaar is */
const typedEnd = (text: string, start: number, perSecond = 24) => start + text.length / perSecond;

/** Een bedrag dat oploopt naar zijn eindwaarde */
const counted = (to: number, t: number, start: number, duration = 1.2) => to * easeOut(clamp((t - start) / duration));

const euro = (amount: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

/** Een knop is even ingedrukt op het moment dat de cursor klikt */
const pressedAt = (t: number, at: number) => t >= at && t < at + 0.25;

// ---------- De app eromheen ----------

const NAVIGATION = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'calendar', label: 'Agenda', icon: CalendarDays },
  { key: 'customers', label: 'Klanten', icon: Users },
  { key: 'quotes', label: 'Offertes', icon: FileText },
  { key: 'invoices', label: 'Facturen', icon: ReceiptEuro },
  { key: 'expenses', label: 'Kosten', icon: Receipt },
  { key: 'bank', label: 'Bank', icon: Landmark },
  { key: 'vat', label: 'Btw-overzicht', icon: Percent },
  { key: 'reports', label: 'Jaarcijfers', icon: ChartColumn },
  { key: 'products', label: 'Producten', icon: Package },
  { key: 'notes', label: 'Notities', icon: FilePen },
  { key: 'settings', label: 'Instellingen', icon: Settings },
];

/** Een pagina van de app: de zijbalk, de kop met titel en knoppen, en de inhoud */
function AppPage({ active, title, actions, children }: { active: string; title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="site-app">
      <div className="sidebar">
        <div className="logo">
          <Image src="/logo.svg" alt="" width={30} height={30} />
        </div>
        <nav className="navigation">
          {NAVIGATION.map(({ key, label, icon: Icon }) => (
            <span key={key} className={key === active ? 'active' : ''}>
              <Icon size={18} />
              <span className="label">{label}</span>
            </span>
          ))}
        </nav>
      </div>
      <div className="content">
        <div className="header">
          <h1>{title}</h1>
          <div className="actions">{actions}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Een knop van de app, die de cursor kan vinden en indrukken */
function Button({ id, kind = '', pressAt, children }: { id?: string; kind?: string; pressAt?: number; children: ReactNode }) {
  const t = useT();
  return (
    <span data-demo={id} className={`button ${kind}${pressAt !== undefined && pressedAt(t, pressAt) ? ' site-pressed' : ''}`}>
      {children}
    </span>
  );
}

/** Een statuslabel zoals in de lijsten van de app */
function Badge({ tone, children }: { tone: 'draft' | 'sent' | 'paid' | 'cancelled'; children: ReactNode }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}

/** De melding rechtsonder, zoals de app hem na een actie toont */
function Toast({ at, title, message }: { at: number; title: string; message: string }) {
  const t = useT();
  if (t < at) return null;
  return (
    <div data-demo="toast" className="toast success">
      <CircleCheck size={20} />
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-description">{message}</div>
      </div>
      <span className="toast-close">
        <X size={18} />
      </span>
    </div>
  );
}

/** Een venster van de app over de pagina heen, tussen twee momenten */
function Dialog({ from, until = 99, title, children }: { from: number; until?: number; title: string; children: ReactNode }) {
  const t = useT();
  if (t < from || t >= until) return null;
  return (
    <div className="modal-overlay">
      <div data-demo="dialog" className="modal">
        <div className="modal-title">
          <h3>{title}</h3>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

/**
 * De muiscursor. Hij loopt een route af: bij elk moment `at` beweegt hij naar
 * het element met data-demo="target" en klikt een seconde later. Hij staat in
 * de app zelf, dus hij beweegt mee als de camera inzoomt; bij het klikken
 * krimpt hij vanuit zijn punt, zodat hij niet verspringt.
 */
function Cursor({ path }: { path: [string, number][] }) {
  const { t, root } = useContext(DemoTime);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const step = [...path].reverse().find(([, at]) => t >= at);
  const target = step?.[0];

  // Het doel kan pas later verschijnen; tot die tijd elke kwart seconde opnieuw kijken
  const [found, setFound] = useState<string | null>(null);
  const retry = target && found !== target ? Math.floor(t * 4) : 0;

  useEffect(() => {
    if (!target || !root) return;
    const element = root.querySelector<HTMLElement>(`[data-demo="${target}"]`);
    if (!element) return;
    const box = positionIn(element, root);
    setPosition({ x: box.x + box.width * 0.55, y: box.y + box.height * 0.6 });
    setFound(target);
  }, [target, root, retry]);

  // Pas zichtbaar vlak voor de eerste beweging, en weg als de laatste klik voorbij is
  if (t < path[0][1] - 0.4 || t > path[path.length - 1][1] + 2.2) return null;
  const clicking = path.some(([, at]) => t >= at + 1 && t < at + 1.25);
  const start = { x: BASE_WIDTH * 0.55, y: 420 };
  const { x, y } = position || start;
  return (
    <MousePointer2
      className={`site-cursor${clicking ? ' clicking' : ''}`}
      size={20}
      // Bewegen met translate en klikken met scale: zo krimpt hij op zijn plek
      style={{ translate: `${x}px ${y}px` }}
    />
  );
}

// ---------- Bouwstenen ----------

/** Een tabel zoals de lijsten in de app; rijen verschijnen op hun moment */
function DataTable({
  id = 'table',
  headers,
  rows,
}: {
  id?: string;
  headers: string[];
  rows: { at?: number; cells: ReactNode[]; highlight?: boolean; id?: string }[];
}) {
  const t = useT();
  return (
    <div data-demo={id} className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows
            .filter(row => t >= (row.at ?? 0))
            .map((row, index) => (
              <tr key={index} data-demo={row.id} className={`${row.at && row.at > 0 ? 'site-appear' : ''}${row.highlight ? ' selected' : ''}`}>
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/** Stat-tegels zoals op het dashboard, met bedragen die oplopen */
function Stats({ items, at = 0.3 }: { items: { label: string; value: number; note: string; format?: (n: number) => string }[]; at?: number }) {
  const t = useT();
  return (
    <div data-demo="stats" className="grid four">
      {items.map((item) => (
        <div key={item.label} className="block stat">
          <span className="label">{item.label}</span>
          <div className="value">{(item.format || euro)(counted(item.value, t, at))}</div>
          <div className="note">{item.note}</div>
        </div>
      ))}
    </div>
  );
}

/** Een veld zoals in de formulieren van de app, met tekst die wordt getypt */
function Field({ id, label, text, at, perSecond }: { id?: string; label: string; text: string; at: number; perSecond?: number }) {
  const t = useT();
  const value = typed(text, t, at, perSecond);
  const typing = t >= at && value.length < text.length;
  return (
    <div data-demo={id} className="form-group">
      <label>{label}</label>
      <input type="text" readOnly value={value + (typing ? '|' : '')} placeholder={`Vul ${label.toLowerCase()} in`} />
    </div>
  );
}

/** Een regel van een document: omschrijving getypt, daarna het bedrag */
interface PaperLine {
  description: string;
  amount: number;
  at: number;
}

/**
 * Een offerte of factuur zoals hij op papier komt, net als in de editor en op
 * de pagina van de klant: bedrijf rechtsboven, klant en gegevens, de regels
 * en het totaal. Regels worden getypt; het totaal loopt mee.
 */
function Paper({
  title,
  meta,
  lines,
  footer,
}: {
  title: string;
  meta: [string, string][];
  lines: PaperLine[];
  footer?: ReactNode;
}) {
  const t = useT();
  const shown = lines.filter(line => t >= line.at);
  const subtotal = shown.reduce((sum, line) => sum + (t >= typedEnd(line.description, line.at) ? line.amount : 0), 0);

  return (
    <div className="site-paper">
      <div className="site-paper-company">
        <strong>Klusbedrijf Voorbeeld</strong>
        <span>Voorbeeldstraat 1</span>
        <span>1234 AB Voorbeeld</span>
      </div>
      <h2>{title}</h2>
      <div className="site-paper-head">
        <div>
          <strong>Familie Verhoef</strong>
          <span>Voorbeeldlaan 12</span>
          <span>1234 CD Voorbeeld</span>
        </div>
        <dl data-demo="meta">
          {meta.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <table data-demo="lines">
        <thead>
          <tr>
            <th>Omschrijving</th>
            <th>Bedrag excl. btw</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((line) => {
            const description = typed(line.description, t, line.at);
            const done = t >= typedEnd(line.description, line.at);
            return (
              <tr key={line.description}>
                <td>
                  {description}
                  {!done && <span className="site-caret" />}
                </td>
                <td>{done ? euro(line.amount) : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div data-demo="total" className="site-paper-total">
        <span>Totaal incl. btw</span>
        <strong>{euro(subtotal * 1.21)}</strong>
      </div>
      {footer}
    </div>
  );
}

/** Een handtekening die zich vanaf een moment tekent */
function Signature({ at, duration = 1.6 }: { at: number; duration?: number }) {
  const t = useT();
  const progress = easeOut(clamp((t - at) / duration));
  return (
    <svg viewBox="0 0 220 60" className="site-signature" aria-hidden="true">
      <path
        d="M8 44 C 22 10, 34 52, 46 30 S 66 14, 74 36 S 96 54, 104 28 S 128 12, 136 34 S 160 50, 172 26 S 196 18, 212 22"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
}

/** Een omzetgrafiek die zich tekent */
function Chart({ at }: { at: number }) {
  const t = useT();
  const progress = easeOut(clamp((t - at) / 2));
  return (
    <svg viewBox="0 0 600 160" className="site-chart" aria-hidden="true">
      {[40, 80, 120].map(y => (
        <line key={y} x1="0" x2="600" y1={y} y2={y} />
      ))}
      <path
        className="realized"
        d="M0 120 C 60 90, 110 60, 170 66 S 260 120, 320 112 S 420 40, 480 36 S 560 70, 600 64"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      <path
        className="unrealized"
        d="M0 140 C 80 130, 140 128, 200 136 S 330 150, 380 140 S 500 120, 600 132"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
}

/** Een schakelaar zoals bij Plug-ins, die op een moment aan gaat */
function PluginRow({ icon, title, description, onAt }: { icon: ReactNode; title: string; description: string; onAt: number }) {
  const t = useT();
  return (
    <div data-demo="plugin" className="plugin">
      <span className="plugin-icon">{icon}</span>
      <span className="information">
        <span className="title">{title}</span>
        <span className="description">{description}</span>
      </span>
      <span data-demo="toggle" className={`toggle${t >= onAt ? ' on' : ''}`}>
        <span className="knob" />
      </span>
    </div>
  );
}

/** Het uploadvak van de app, met daarna het gekozen bestand */
function Dropzone({ fileAt, name, size }: { fileAt: number; name: string; size: string }) {
  const t = useT();
  return (
    <div className="file-upload">
      <span data-demo="dropzone" className={`dropzone${t >= fileAt - 0.6 && t < fileAt ? ' dragging' : ''}`}>
        <span className="icon">
          <Upload size={18} />
        </span>
        <span className="instruction">Sleep een bestand hierheen of klik om te kiezen</span>
        <span className="hint">JPG, PNG of PDF</span>
      </span>
      {t >= fileAt && (
        <div className="attachment site-appear">
          <span className="preview">
            <Receipt size={18} />
          </span>
          <span className="details">
            <span className="name">{name}</span>
            <span className="meta">{size}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/** Een WhatsApp-gesprek zoals op de homepage, met berichten op hun moment */
function Chat({ messages }: { messages: { at: number; own?: boolean; text: string }[] }) {
  const t = useT();
  return (
    <div className="site-chat">
      <div data-demo="chat" className="whatsapp">
        <div className="title">Synbased</div>
        {messages
          .filter(message => t >= message.at)
          .map((message) => (
            <p key={message.text} className={`site-appear${message.own ? ' own' : ''}`}>
              {message.own ? typed(message.text, t, message.at, 40) : message.text}
            </p>
          ))}
      </div>
    </div>
  );
}

/** Een lijst met mails, zoals de inbox */
function MailList({ mails }: { mails: { at: number; from: string; subject: string; preview: string; time: string; unread?: boolean }[] }) {
  const t = useT();
  return (
    <div data-demo="mails" className="block site-mail-list">
      {mails
        .filter(mail => t >= mail.at)
        .map((mail) => (
          <div key={mail.subject} className={`site-mail site-appear${mail.unread ? ' unread' : ''}`}>
            <span className="site-avatar">{mail.from.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
            <span className="site-mail-text">
              <strong>{mail.from}</strong>
              <span>{mail.subject}</span>
              <span className="placeholder">{mail.preview}</span>
            </span>
            <span className="placeholder">{mail.time}</span>
          </div>
        ))}
    </div>
  );
}

// ---------- De schermen per module ----------

const QUOTE_LINES: PaperLine[] = [
  { description: 'Verwijderen bestaande vloer', amount: 1300, at: 0.5 },
  { description: 'Plaatsen vloerverwarming 45 m²', amount: 3240, at: 1.9 },
  { description: 'Tegelen keuken en gang', amount: 1500, at: 3.5 },
];
// Al ingevuld: ruim voor het begin van de stap, dus zonder typen
const QUOTE_DONE = QUOTE_LINES.map(line => ({ ...line, at: -99 }));
const QUOTE_META: [string, string][] = [['Offertenummer', 'OFF-118'], ['Offertedatum', '14-10-2026'], ['Geldig tot', '13-11-2026']];

const INVOICE_LINES: PaperLine[] = [
  { description: 'Badkamer tegelen', amount: 1650, at: 0.5 },
  { description: 'Kitwerk en afwerking', amount: 399.59, at: 1.8 },
];
const INVOICE_DONE = INVOICE_LINES.map(line => ({ ...line, at: -99 }));

/** Een scherm per stap; de naam is de slug van de module */
const SCENES: Record<string, (() => ReactNode)[]> = {
  quotes: [
    () => (
      <AppPage active="quotes" title="Offerte bewerken" actions={<><Button kind="cancel">Versturen</Button><Button>Bijwerken</Button></>}>
        <Paper title="Offerte" meta={QUOTE_META} lines={QUOTE_LINES} />
      </AppPage>
    ),
    () => (
      <AppPage active="quotes" title="Offerte bewerken" actions={<><Button id="send" kind="cancel" pressAt={1.6}>Versturen</Button><Button>Bijwerken</Button></>}>
        <Paper title="Offerte" meta={QUOTE_META} lines={QUOTE_DONE} />
        <Dialog from={1.8} until={4} title="Offerte versturen">
          <p>Familie Verhoef krijgt een mail met een knop naar deze offerte om hem te bekijken en te ondertekenen.</p>
          <div className="buttons">
            <Button kind="cancel">Annuleren</Button>
            <Button id="confirm" pressAt={3.4}>Versturen</Button>
          </div>
        </Dialog>
        <Cursor path={[["send", 0.6], ["confirm", 2.4]]} />
        <Toast at={4} title="Verstuurd" message="De offerte is naar verhoef@voorbeeld.nl gestuurd" />
      </AppPage>
    ),
    () => {
      const t = useT();
      const signed = t >= 4.6;
      return (
        <div className="site-public">
          <Paper
            title="Offerte"
            meta={QUOTE_META}
            lines={QUOTE_DONE}
            footer={
              <div className="site-paper-sign">
                <div>
                  <span className="site-paper-date">{typed('16-10-2026, Voorbeeld', t, 0.4, 30)}</span>
                  <span>Plaats / datum</span>
                </div>
                <div data-demo="signature">
                  <Signature at={1.2} />
                  <span>Handtekening opdrachtgever</span>
                </div>
              </div>
            }
          />
          <div className="site-public-bar">
            {signed ? (
              <span className="autosave-status saved site-appear">Ondertekend door J. Verhoef</span>
            ) : (
              <span className="autosave-status">{t >= 2.8 ? typed('J. Verhoef', t, 2.8, 14) : 'Teken hierboven met je vinger of muis'}</span>
            )}
            <Button id="sign" pressAt={4.4}>Ondertekenen</Button>
          </div>
          <Cursor path={[["sign", 3.4]]} />
        </div>
      );
    },
    () => {
      const t = useT();
      return (
        <AppPage active="quotes" title="Offertes" actions={<Button id="convert" pressAt={3.4}>Omzetten naar factuur</Button>}>
          <DataTable
            headers={['Offerte #', 'Klant', 'Totaal', 'Status']}
            rows={[
              { cells: ['OFF-118', 'Familie Verhoef', '€ 7.308,40', t >= 0.8 ? <Badge tone="paid">Goedgekeurd</Badge> : <Badge tone="sent">Verzonden</Badge>], highlight: t >= 0.8 },
              { cells: ['OFF-117', 'Van Leeuwen Vastgoed', '€ 18.450,00', <Badge key="b" tone="sent">Verzonden</Badge>] },
              { cells: ['OFF-116', 'M. de Graaf', '€ 2.950,00', <Badge key="b" tone="draft">Concept</Badge>] },
            ]}
          />
          <Cursor path={[["convert", 2.4]]} />
          <Toast at={3.7} title="Omgezet" message="Factuur FAC-088 staat klaar als concept" />
        </AppPage>
      );
    },
  ],
  invoices: [
    () => (
      <AppPage active="invoices" title="Factuur bewerken" actions={<><Button kind="cancel">Versturen</Button><Button kind="cancel">Markeren als verzonden</Button><Button>Bijwerken</Button></>}>
        <Paper title="Factuur" meta={[['Factuurnummer', 'Volgt bij versturen'], ['Factuurdatum', '16-10-2026'], ['Vervaldatum', '30-10-2026']]} lines={INVOICE_LINES} />
      </AppPage>
    ),
    () => {
      const t = useT();
      const sent = t >= 4;
      return (
        <AppPage
          active="invoices"
          title={sent ? 'Factuur FAC-087' : 'Factuur bewerken'}
          actions={sent ? <><span className="autosave-status saved site-appear">Verzonden op 16-10-2026</span><Button kind="cancel">Creditfactuur maken</Button></> : <><Button id="send" kind="cancel" pressAt={1.6}>Versturen</Button><Button>Bijwerken</Button></>}
        >
          <Paper
            title="Factuur"
            meta={[['Factuurnummer', sent ? 'FAC-087' : 'Volgt bij versturen'], ['Factuurdatum', '16-10-2026'], ['Vervaldatum', '30-10-2026']]}
            lines={INVOICE_DONE}
          />
          <Dialog from={1.8} until={4} title="Factuur versturen">
            <p>De klant krijgt een mail met de betaalgegevens en QR-code. Hij krijgt dan zijn nummer en is daarna niet meer te wijzigen.</p>
            <div className="buttons">
              <Button kind="cancel">Annuleren</Button>
              <Button id="confirm" pressAt={3.4}>Versturen</Button>
            </div>
          </Dialog>
          <Cursor path={[["send", 0.6], ["confirm", 2.4]]} />
          <Toast at={4} title="Verstuurd" message="De factuur is naar J. Dekker gestuurd" />
        </AppPage>
      );
    },
    () => {
      const t = useT();
      const paid = t >= 2.2;
      return (
        <AppPage active="invoices" title="Facturen" actions={<Button>Factuur maken</Button>}>
          <DataTable
            headers={['Factuur #', 'Klant', 'Totaal', 'Status', 'Vervaldatum']}
            rows={[
              { cells: ['FAC-087', 'J. Dekker', '€ 2.480,00', paid ? <Badge tone="paid">Betaald</Badge> : <Badge tone="sent">Verzonden</Badge>, '30-10-2026'], highlight: paid },
              { cells: ['FAC-086', 'Familie Mulder', '€ 5.615,25', <Badge key="b" tone="sent">Verzonden</Badge>, '28-10-2026'] },
              { cells: ['FAC-085', 'Van Leeuwen Vastgoed', '€ 3.990,00', <Badge key="b" tone="paid">Betaald</Badge>, '20-10-2026'] },
            ]}
          />
          <Toast at={2.2} title="Betaald" message="€ 2.480,00 van J. Dekker, vanzelf gekoppeld aan FAC-087" />
        </AppPage>
      );
    },
  ],
  customers: [
    () => (
      <AppPage active="customers" title="Nieuwe klant toevoegen" actions={<><Button kind="cancel">Annuleren</Button><Button id="save" pressAt={4.6}>Opslaan</Button></>}>
        <div data-demo="form" className="block form-section">
          <div className="form-row">
            <Field label="Voornaam" text="Jan" at={0.4} />
            <Field label="Achternaam" text="Verhoef" at={0.9} />
          </div>
          <Field label="E-mail" text="verhoef@voorbeeld.nl" at={1.6} />
          <div className="form-row">
            <Field label="Straat en huisnummer" text="Voorbeeldlaan 12" at={2.6} />
            <Field label="Plaats" text="Voorbeeld" at={3.3} />
          </div>
        </div>
        <Cursor path={[["save", 3.6]]} />
        <Toast at={4.9} title="Opgeslagen" message="Familie Verhoef staat bij je klanten" />
      </AppPage>
    ),
    () => {
      const t = useT();
      const tab = t >= 1.6 ? 'offertes' : 'algemeen';
      return (
        <AppPage active="customers" title="Klant bewerken" actions={<Button>Opslaan</Button>}>
          <div className="tabs">
            <button className={tab === 'algemeen' ? 'active' : ''}>Algemeen</button>
            <button>Notities</button>
            <button data-demo="tab" className={tab === 'offertes' ? 'active' : ''}>Offertes</button>
          </div>
          {tab === 'offertes' ? (
            <DataTable
              headers={['Offerte #', 'Offertedatum', 'Totaal', 'Status']}
              rows={[
                { at: 1.8, cells: ['OFF-118', '14-10-2026', '€ 7.308,40', <Badge key="b" tone="paid">Goedgekeurd</Badge>] },
                { at: 2.1, cells: ['OFF-104', '02-09-2026', '€ 1.980,00', <Badge key="b" tone="sent">Verzonden</Badge>] },
              ]}
            />
          ) : (
            <div data-demo="form" className="block form-section">
              <Field label="Naam" text="Familie Verhoef" at={-99} />
              <Field label="E-mail" text="verhoef@voorbeeld.nl" at={-99} />
            </div>
          )}
          <Cursor path={[["tab", 0.5]]} />
        </AppPage>
      );
    },
    () => (
      <AppPage active="quotes" title="Nieuwe offerte aanmaken" actions={<Button>Opslaan</Button>}>
        <Paper title="Offerte" meta={[['Offertenummer', 'OFF-119'], ['Offertedatum', '16-10-2026']]} lines={[{ description: 'Schilderwerk kozijnen', amount: 1450, at: 0.8 }]} />
      </AppPage>
    ),
  ],
  products: [
    () => {
      const t = useT();
      return (
        <AppPage active="products" title="Producten" actions={<Button>Product toevoegen</Button>}>
          <DataTable
            headers={['Product', 'Eenheid', 'Prijs']}
            rows={[
              { cells: ['Uurloon', 'uur', '€ 55,00'] },
              { cells: ['Voorrijkosten', 'post', '€ 35,00'] },
              { at: 4.3, cells: ['Tegelwerk vloer', 'm²', '€ 42,00'], highlight: true },
            ]}
          />
          <Dialog from={0.3} until={4.2} title="Product toevoegen">
            <div className="form-section">
              <Field label="Naam" text="Tegelwerk vloer" at={0.6} />
              <div className="form-row">
                <Field label="Eenheid" text="m²" at={1.5} />
                <Field label="Prijs excl. btw" text="42,00" at={1.9} />
              </div>
            </div>
            <div className="buttons">
              <Button kind="cancel">Annuleren</Button>
              <Button id="save" pressAt={3.9}>Opslaan</Button>
            </div>
          </Dialog>
          <Cursor path={[["save", 2.9]]} />
          <Toast at={4.2} title="Opgeslagen" message="Tegelwerk vloer staat bij je producten" />
        </AppPage>
      );
    },
    () => {
      const t = useT();
      const picked = t >= 3.3;
      return (
        <AppPage active="quotes" title="Offerte bewerken" actions={<Button>Bijwerken</Button>}>
          <div data-demo="form" className="block form-section">
            <div className="form-row">
              <div className="form-group site-suggest">
                <label>Omschrijving</label>
                <input type="text" readOnly value={picked ? 'Tegelwerk vloer' : typed('Tegel', t, 0.4, 8)} />
                {t >= 1.2 && !picked && (
                  <div data-demo="suggest" className="site-suggestions site-appear">
                    <span data-demo="suggestion" className="active">Tegelwerk vloer <em>€ 42,00 per m²</em></span>
                    <span>Tegelwerk wand <em>€ 48,00 per m²</em></span>
                  </div>
                )}
              </div>
              <Field label="Aantal" text={picked ? '45' : ''} at={3.4} />
              <div data-demo="amount" className="form-group">
                <label>Bedrag</label>
                <input type="text" readOnly value={t >= 3.8 ? '€ 1.890,00' : ''} />
              </div>
            </div>
          </div>
          <Cursor path={[["suggestion", 2.2]]} />
        </AppPage>
      );
    },
    () => (
      <AppPage active="products" title="Producten" actions={<Button>Product toevoegen</Button>}>
        <DataTable
          headers={['Product', 'Eenheid', 'Prijs']}
          rows={[
            { cells: ['Tegelwerk vloer', 'm²', <PriceChange key="p" />], highlight: true },
            { cells: ['Uurloon', 'uur', '€ 55,00'] },
          ]}
        />
        <Toast at={2.4} title="Opgeslagen" message="Nieuwe prijs geldt vanaf de volgende offerte" />
      </AppPage>
    ),
  ],
  expenses: [
    () => {
      const t = useT();
      const reading = t >= 2.2 && t < 3.4;
      return (
        <AppPage active="expenses" title="Kosten toevoegen" actions={<><Button kind="cancel">Annuleren</Button><Button>Opslaan</Button></>}>
          <div data-demo="form" className="block form-section">
            <Dropzone fileAt={1.8} name={reading ? 'Wordt gelezen...' : 'bon-gamma.jpg'} size="412 kB" />
            <div className="form-row">
              <Field label="Leverancier" text="Gamma Zwolle" at={3.4} perSecond={40} />
              <Field label="Datum" text="14-10-2026" at={3.6} perSecond={40} />
            </div>
          </div>
          <Cursor path={[["dropzone", 0.5]]} />
          <Toast at={3.6} title="Ingevuld" message="Controleer de gegevens en sla op" />
        </AppPage>
      );
    },
    () => (
      <AppPage active="expenses" title="Kosten toevoegen" actions={<><Button kind="cancel">Annuleren</Button><Button id="save" pressAt={3.4}>Opslaan</Button></>}>
        <div data-demo="form" className="block form-section">
          <Field label="Categorie" text="Inkoop materiaal" at={0.3} perSecond={40} />
          <div className="form-row">
            <Field label="Bedrag excl. btw" text="82,64" at={0.9} />
            <Field label="Tarief" text="21%" at={1.3} />
            <Field label="Btw" text="17,36" at={1.6} />
          </div>
          <div className="form-row">
            <span className="toggle on"><span className="knob" /></span>
            <span>Al betaald</span>
          </div>
        </div>
        <Cursor path={[["save", 2.4]]} />
        <Toast at={3.7} title="Opgeslagen" message="Gamma Zwolle, € 100,00, waarvan € 17,36 btw" />
      </AppPage>
    ),
    () => (
      <AppPage active="vat" title="Btw-overzicht" actions={<Button>Exporteren</Button>}>
        <VatTable at={0.3} />
      </AppPage>
    ),
  ],
  bank: [
    () => (
      <AppPage active="bank" title="Bank" actions={<Button>Afschrift importeren</Button>}>
        <Dialog from={0.2} until={3} title="Afschrift importeren">
          <div className="form-section">
            <Dropzone fileAt={1.7} name="oktober.xml" size="CAMT.053 · 48 transacties" />
          </div>
        </Dialog>
        <Cursor path={[["dropzone", 0.5]]} />
        <BankTable start={3.1} linked={false} />
        <Toast at={3.1} title="Ingelezen" message="48 nieuwe transacties uit oktober.xml" />
      </AppPage>
    ),
    () => (
      <AppPage active="bank" title="Bank" actions={<Button>Afschrift importeren</Button>}>
        <BankTable start={0} linked />
      </AppPage>
    ),
    () => {
      const t = useT();
      return (
        <AppPage active="bank" title="Bank" actions={<Button>Afschrift importeren</Button>}>
          <BankTable start={-99} linked mollieDone={t >= 4} />
          <Dialog from={0.4} until={4} title="Transactie koppelen">
            <p>16-10-2026 · € 1.204,10 · Mollie B.V.</p>
            <div className="form-section">
              <div className="form-group">
                <label>Hoort bij</label>
                <input type="text" readOnly value={t >= 2.2 ? 'Overboeking of uitbetaling (zoals Mollie)' : ''} placeholder="Kies een factuur of categorie" />
              </div>
            </div>
            <div className="buttons">
              <Button id="save" pressAt={3.6}>Opslaan</Button>
            </div>
          </Dialog>
          <Cursor path={[["save", 2.6]]} />
          <Toast at={4} title="Gelukt" message="Alles is verwerkt" />
        </AppPage>
      );
    },
  ],
  vat: [
    () => (
      <AppPage active="vat" title="Btw-overzicht" actions={<Button>Exporteren</Button>}>
        <VatTable at={0.3} />
      </AppPage>
    ),
    () => (
      <AppPage active="vat" title="Btw-overzicht" actions={<Button>Exporteren</Button>}>
        <VatTable at={-99} highlight />
      </AppPage>
    ),
    () => (
      <AppPage active="vat" title="Btw-overzicht" actions={<Button id="export" pressAt={1.6}>Exporteren</Button>}>
        <VatTable at={-99} />
        <Cursor path={[["export", 0.6]]} />
        <Toast at={1.9} title="Gedownload" message="Btw-overzicht Q3 2026.csv" />
      </AppPage>
    ),
  ],
  reports: [
    () => (
      <AppPage active="reports" title="Jaarcijfers" actions={<Button>Grootboek exporteren</Button>}>
        <Stats
          items={[
            { label: 'Omzet', value: 96420, note: 'Exclusief btw, 2026' },
            { label: 'Kosten', value: 31870, note: 'Exclusief aftrekbare btw' },
            { label: 'Winst', value: 64550, note: 'Omzet min kosten' },
            { label: 'Bank', value: 23410, note: 'Saldo op 31-12-2026' },
          ]}
        />
      </AppPage>
    ),
    () => (
      <AppPage active="reports" title="Jaarcijfers" actions={<Button>Grootboek exporteren</Button>}>
        <div className="block">
          <div className="header">
            <h2>Winst-en-verliesrekening 2026</h2>
          </div>
          <DataTable
            headers={['Rekening', 'Omschrijving', 'Bedrag']}
            rows={[
              { at: 0.3, cells: [<strong key="s">Omzet</strong>, '', ''] },
              { at: 0.6, cells: ['8000', 'Omzet hoog tarief (21%)', '€ 88.270,00'] },
              { at: 0.9, cells: ['8010', 'Omzet laag tarief (9%)', '€ 8.150,00'] },
              { at: 1.4, cells: [<strong key="s">Kosten</strong>, '', ''] },
              { at: 1.7, cells: ['7000', 'Inkoop materiaal', '€ 24.310,00'] },
              { at: 2.0, cells: ['4300', 'Auto en vervoer', '€ 5.120,00'] },
              { at: 2.5, id: 'result', cells: ['', <strong key="s">Winst</strong>, <strong key="v">€ 64.550,00</strong>], highlight: true },
            ]}
          />
        </div>
      </AppPage>
    ),
    () => (
      <AppPage active="reports" title="Jaarcijfers" actions={<Button id="export" pressAt={1.6}>Grootboek exporteren</Button>}>
        <Stats
          at={-99}
          items={[
            { label: 'Omzet', value: 96420, note: 'Exclusief btw, 2026' },
            { label: 'Kosten', value: 31870, note: 'Exclusief aftrekbare btw' },
            { label: 'Winst', value: 64550, note: 'Omzet min kosten' },
            { label: 'Bank', value: 23410, note: 'Saldo op 31-12-2026' },
          ]}
        />
        <Cursor path={[["export", 0.6]]} />
        <Toast at={1.9} title="Gedownload" message="Grootboek 2026.csv, 1.824 boekingen" />
      </AppPage>
    ),
  ],
  dashboard: [
    () => (
      <AppPage active="dashboard" title="Dashboard" actions={<><Button kind="tertiary">Factuur maken</Button><Button>Offerte maken</Button></>}>
        <Stats
          items={[
            { label: 'Te ontvangen', value: 12085.25, note: '3 facturen wachten op betaling' },
            { label: 'Verlopen', value: 1990, note: '1 factuur over de vervaldatum' },
            { label: 'Openstaande offertes', value: 44128.9, note: '5 offertes staan open' },
            { label: 'Goedgekeurd', value: 76, note: '13 van 17 offertes', format: (n) => `${Math.round(n)}%` },
          ]}
        />
      </AppPage>
    ),
    () => (
      <AppPage active="dashboard" title="Dashboard" actions={<><Button kind="tertiary">Factuur maken</Button><Button>Offerte maken</Button></>}>
        <div className="block">
          <div className="header">
            <h2>Omzet</h2>
          </div>
          <RevenueLegend at={0.3} />
          <div data-demo="chart">
            <Chart at={0.6} />
          </div>
        </div>
      </AppPage>
    ),
    () => (
      <AppPage active="dashboard" title="Dashboard" actions={<><Button kind="tertiary">Factuur maken</Button><Button>Offerte maken</Button></>}>
        <div className="block">
          <div className="header">
            <h2>Openstaande facturen</h2>
          </div>
          <DataTable
            headers={['Factuur #', 'Klant', 'Status', 'Vervaldatum', 'Totaal']}
            rows={[
              { at: 0.3, cells: ['FAC-085', 'Van Leeuwen Vastgoed', <Badge key="b" tone="cancelled">Verlopen</Badge>, '13-10-2026', '€ 1.990,00'], highlight: true },
              { at: 0.6, cells: ['FAC-087', 'J. Dekker', <Badge key="b" tone="sent">Verzonden</Badge>, '30-10-2026', '€ 2.480,00'] },
              { at: 0.9, cells: ['FAC-086', 'Familie Mulder', <Badge key="b" tone="sent">Verzonden</Badge>, '28-10-2026', '€ 5.615,25'] },
            ]}
          />
        </div>
        <Toast at={1.8} title="Herinnering" message="FAC-085 krijgt morgen vanzelf een herinnering" />
      </AppPage>
    ),
  ],
  notes: [
    () => (
      <AppPage active="notes" title="Nieuwe notitie aanmaken" actions={<><Button kind="cancel">Annuleren</Button><Button>Opslaan</Button></>}>
        <div data-demo="form" className="block form-section">
          <Field label="Klant" text="Familie Verhoef" at={0.4} perSecond={30} />
          <Field label="Titel" text="Opmeting keuken" at={1.3} />
        </div>
      </AppPage>
    ),
    () => {
      const t = useT();
      return (
        <AppPage active="notes" title="Notitie bewerken" actions={<Button>Opslaan</Button>}>
          <div data-demo="note" className="block site-note">
            <h3>Opmeting keuken</h3>
            <ul>
              {['Keuken 4,20 × 3,10 m', 'Gang 6,80 × 1,20 m', 'Oude tegels eruit, vloerverwarming erin'].map((line, index) =>
                t >= 0.4 + index * 1.2 ? <li key={line}>{typed(line, t, 0.4 + index * 1.2, 30)}</li> : null
              )}
            </ul>
          </div>
        </AppPage>
      );
    },
    () => (
      <AppPage active="customers" title="Klant bewerken" actions={<Button>Notitie toevoegen</Button>}>
        <div className="tabs">
          <button>Algemeen</button>
          <button className="active">Notities</button>
          <button>Offertes</button>
        </div>
        <DataTable
          headers={['Notitie', 'Laatst bewerkt']}
          rows={[
            { at: 0.4, cells: ['Opmeting keuken', '16-10-2026'], highlight: true },
            { at: 0.7, cells: ['Afspraak start werkzaamheden', '14-10-2026'] },
          ]}
        />
      </AppPage>
    ),
  ],
  google: mailScenes('Google', <GoogleIcon size={24} />, 'Gmail en Google Agenda', 'Google Agenda'),
  microsoft: mailScenes('Microsoft', <MicrosoftIcon size={24} />, 'Outlook-mail en -agenda', 'Outlook'),
  whatsapp: [
    () => (
      <Chat messages={[{ at: 0.4, own: true, text: 'Familie Verhoef, Voorbeeldlaan 12. Keuken en gang 45 m² oude tegels eruit, vloerverwarming en opnieuw tegelen.' }]} />
    ),
    () => (
      <Chat
        messages={[
          { at: -99, own: true, text: 'Familie Verhoef, Voorbeeldlaan 12. Keuken en gang 45 m² oude tegels eruit, vloerverwarming en opnieuw tegelen.' },
          { at: 1.4, text: 'Offerte OFF-118 staat als concept klaar voor Familie Verhoef, € 7.308,40.' },
        ]}
      />
    ),
    () => (
      <AppPage active="quotes" title="Offertes" actions={<Button>Offerte maken</Button>}>
        <DataTable
          headers={['Offerte #', 'Klant', 'Totaal', 'Status']}
          rows={[
            { at: 0.4, cells: ['OFF-118', 'Familie Verhoef', '€ 7.308,40', <Badge key="b" tone="draft">Concept</Badge>], highlight: true },
            { cells: ['OFF-117', 'Van Leeuwen Vastgoed', '€ 18.450,00', <Badge key="b" tone="sent">Verzonden</Badge>] },
          ]}
        />
      </AppPage>
    ),
  ],
  ai: [
    () => (
      <AppPage active="inbox" title="Inbox" actions={<Button id="convert" pressAt={2.4}>Omzetten naar offerte</Button>}>
        <MailList mails={[{ at: 0, from: 'Familie Verhoef', subject: 'Nieuwe vloer keuken en gang', preview: 'Wij willen graag een nieuwe vloer, ongeveer 45 m², met vloerverwarming…', time: '10:24', unread: true }]} />
        <Cursor path={[["convert", 1.4]]} />
      </AppPage>
    ),
    () => (
      <AppPage active="inbox" title="Omzetten naar offerte" actions={<Button>Offerte maken</Button>}>
        <div data-demo="form" className="block form-section">
          <Field label="Klant" text="Familie Verhoef (nieuw)" at={0.3} perSecond={40} />
          <DataTable
            headers={['Regel', 'Prijs', 'Op basis van']}
            rows={[
              { at: 1.2, cells: ['Tegels verwijderen', '€ 1.300,00', 'OFF-104'] },
              { at: 1.6, cells: ['Vloerverwarming 45 m²', '€ 72,00 per m²', 'OFF-109'] },
            ]}
          />
          <Field label="Ontbreekt nog" text="Adres van de klus" at={2.4} />
        </div>
      </AppPage>
    ),
    () => {
      const t = useT();
      const reading = t >= 1.2 && t < 2.6;
      return (
        <AppPage active="expenses" title="Kosten toevoegen" actions={<Button>Opslaan</Button>}>
          <div data-demo="form" className="block form-section">
            <Dropzone fileAt={0.6} name={reading ? 'Wordt gelezen...' : 'bon-bouwmaat.pdf'} size="96 kB" />
            <div className="form-row">
              <Field label="Leverancier" text="Bouwmaat Utrecht" at={2.6} perSecond={40} />
              <Field label="Btw 21%" text="31,46" at={2.9} perSecond={40} />
            </div>
          </div>
          <Toast at={2.8} title="Ingevuld" message="Gelezen door Claude; controleer en sla op" />
        </AppPage>
      );
    },
  ],
  mollie: [
    () => (
      <AppPage active="settings" title="Instellingen" actions={null}>
        <div className="block plugin-list">
          <PluginRow icon={<MollieIcon size={24} />} title="Mollie" description="Laat klanten hun factuur direct betalen met iDEAL" onAt={3.2} />
        </div>
        <Dialog from={0.6} until={3.2} title="Mollie">
          <div className="form-section">
            <Field label="API-sleutel" text="live_••••••••••••" at={0.9} />
          </div>
          <div className="buttons">
            <Button id="install" pressAt={2.9}>Installeren</Button>
          </div>
        </Dialog>
        <Cursor path={[["install", 1.9]]} />
        <Toast at={3.2} title="Geïnstalleerd" message="Je klanten kunnen hun factuur nu direct betalen" />
      </AppPage>
    ),
    () => (
      <div className="site-public">
        <Paper
          title="Factuur"
          meta={[['Factuurnummer', 'FAC-087'], ['Vervaldatum', '30-10-2026']]}
          lines={INVOICE_DONE}
        />
        <div className="site-public-bar">
          <span className="autosave-status">Betaal met iDEAL, Bancontact of de QR-code</span>
          <Button id="pay" pressAt={1.6}>Nu betalen</Button>
        </div>
        <Cursor path={[["pay", 0.6]]} />
      </div>
    ),
    () => {
      const t = useT();
      return (
        <AppPage active="invoices" title="Facturen" actions={<Button>Factuur maken</Button>}>
          <DataTable
            headers={['Factuur #', 'Klant', 'Totaal', 'Status']}
            rows={[
              { cells: ['FAC-087', 'J. Dekker', '€ 2.480,00', t >= 1 ? <Badge tone="paid">Betaald</Badge> : <Badge tone="sent">Verzonden</Badge>], highlight: t >= 1 },
              { cells: ['FAC-086', 'Familie Mulder', '€ 5.615,25', <Badge key="b" tone="sent">Verzonden</Badge>] },
            ]}
          />
          <Toast at={1} title="Betaald via Mollie" message="FAC-087 staat vanzelf op betaald" />
        </AppPage>
      );
    },
  ],
  'bank-connection': [
    () => {
      const t = useT();
      return (
        <AppPage active="settings" title="Instellingen" actions={null}>
          <div className="block plugin-list">
            <PluginRow icon={<Landmark size={24} />} title="Bankkoppeling" description="Haal je transacties elke ochtend vanzelf op" onAt={99} />
          </div>
          <Dialog from={0.4} title="Bankkoppeling">
            <div className="form-section">
              <div className="form-group">
                <label>Je bank</label>
                <input type="text" readOnly value={t >= 1.6 ? 'Rabobank' : ''} placeholder="Kies je bank" />
              </div>
            </div>
            <div className="buttons">
              <Button id="link" pressAt={3.2}>Koppelen</Button>
            </div>
          </Dialog>
          <Cursor path={[["link", 2.2]]} />
        </AppPage>
      );
    },
    () => {
      const t = useT();
      return (
        <div className="site-public site-consent">
          <div data-demo="consent" className="block">
            <strong>Rabobank</strong>
            <p>Synbased (via GoCardless) wil 90 dagen je rekeninginformatie en transacties lezen.</p>
            <DataTable headers={['Rekening', 'IBAN']} rows={[{ cells: ['Zakelijke rekening', 'NL02 RABO 0123 4567 89'] }]} />
            <div className="buttons">
              {t >= 2.2 ? <span className="autosave-status saved site-appear">Toestemming gegeven</span> : <Button id="consent" pressAt={2}>Toestemming geven</Button>}
            </div>
          </div>
          <Cursor path={[["consent", 1]]} />
        </div>
      );
    },
    () => (
      <AppPage active="bank" title="Bank" actions={<><Button kind="cancel">Nu ophalen</Button><Button>Afschrift importeren</Button></>}>
        <BankTable start={0.3} linked />
        <Toast at={1.6} title="Opgehaald" message="12 nieuwe transacties, 3 facturen vanzelf op betaald" />
      </AppPage>
    ),
  ],
};

/** De totalen boven de omzetgrafiek, zoals op het dashboard */
function RevenueLegend({ at }: { at: number }) {
  const t = useT();
  return (
    <div className="revenue-chart">
      <div className="chart-legend">
        <div className="stat">
          <span className="label">Gerealiseerd</span>
          <div className="value">{euro(counted(77457, t, at))}</div>
          <span className="note">Betaalde facturen</span>
        </div>
        <div className="stat">
          <span className="label">Ongerealiseerd</span>
          <div className="value">{euro(counted(29003, t, at))}</div>
          <span className="note">Verzonden, nog niet betaald</span>
        </div>
      </div>
    </div>
  );
}

/**
 * De camera per scène, zoals in een productvideo: [doel, moment, zoom]. Op
 * het moment zoomt hij rustig in op het element met data-demo="doel"; null is
 * weer het hele scherm. Zonder pad blijft hij op het hele scherm.
 */
type CameraPath = [string | null, number, number?][];

// Hooguit één keer inzoomen per stap, alleen waar het detail klein is, en rustig
const CAMERAS: Record<string, CameraPath[]> = {
  quotes: [
    [['lines', 0.4, 1.35], [null, 5.6]],
    [['dialog', 1.9, 1.3], [null, 4.2]],
    [['signature', 0.8, 1.45], [null, 4.6]],
    [],
  ],
  invoices: [
    [['lines', 0.4, 1.35], [null, 4.4]],
    [['dialog', 1.9, 1.3], [null, 4.2]],
    [],
  ],
  products: [[], [['suggest', 1.1, 1.4], [null, 4.8]], []],
  expenses: [[['form', 0.4, 1.25], [null, 5.2]], [], []],
  bank: [[], [['table', 0.3, 1.25], [null, 4.6]], []],
  vat: [[], [['due', 0.4, 1.4], [null, 4.6]], []],
  reports: [[], [['table', 0.3, 1.25], [null, 4.6]], []],
  dashboard: [[], [['chart', 0.4, 1.25], [null, 4.6]], []],
  notes: [[], [['note', 0.3, 1.35], [null, 5]], []],
};

/** Een prijs die van 42 naar 44 gaat */
function PriceChange() {
  const t = useT();
  return <span className={t >= 1.6 ? 'site-appear' : ''}>{t >= 1.6 ? '€ 44,00' : '€ 42,00'}</span>;
}

/** De btw-aangifte zoals op het Btw-overzicht, met oplopende bedragen */
function VatTable({ at, highlight = false }: { at: number; highlight?: boolean }) {
  const t = useT();
  const amount = (value: number, start: number) => euro(counted(value, t, at + start));
  return (
    <div data-demo="vat" className="block">
      <div className="header">
        <h2>Aangifte</h2>
      </div>
      <DataTable
        headers={['Rubriek', 'Omschrijving', 'Omzet', 'Btw']}
        rows={[
          { at, cells: ['1a', 'Leveringen/diensten belast met hoog tarief', amount(18240, 0), amount(3830.4, 0)] },
          { at: at + 0.3, cells: ['1b', 'Leveringen/diensten belast met laag tarief', amount(2150, 0.3), amount(193.5, 0.3)] },
          { at: at + 0.6, cells: ['5a', 'Verschuldigde btw', '', amount(4023.9, 0.6)] },
          { at: at + 0.9, cells: ['5b', 'Voorbelasting', '', amount(1112.45, 0.9)], highlight },
          { at: at + 1.2, id: 'due', cells: ['', <strong key="s">Te betalen</strong>, '', <strong key="v">{amount(2911.45, 1.2)}</strong>], highlight },
        ]}
      />
    </div>
  );
}

/** De transacties zoals bij Bank, met waar ze bij horen */
function BankTable({ start, linked, mollieDone = false }: { start: number; linked: boolean; mollieDone?: boolean }) {
  const t = useT();
  const linkedAt = (offset: number) => linked && t >= start + offset;
  const open = <Badge tone="draft">Te verwerken</Badge>;
  return (
    <DataTable
      headers={['Datum', 'Tegenpartij', 'Bedrag', 'Hoort bij']}
      rows={[
        { at: start, cells: ['16-10-2026', 'J. Dekker', '€ 2.480,00', linkedAt(0.8) ? <span className="site-appear">Factuur FAC-087</span> : open], highlight: linkedAt(0.8) && !linkedAt(1.4) },
        { at: start + 0.2, cells: ['16-10-2026', 'Gamma Zwolle', '-€ 100,00', linkedAt(1.4) ? <span className="site-appear">Kosten · Gamma Zwolle</span> : open], highlight: linkedAt(1.4) && !linkedAt(2) },
        { at: start + 0.4, cells: ['15-10-2026', 'Mollie B.V.', '€ 1.204,10', mollieDone ? <span className="site-appear">Overboeking of uitbetaling</span> : open], highlight: mollieDone },
        { at: start + 0.6, cells: ['15-10-2026', 'Familie Mulder', '€ 5.615,25', linkedAt(2) ? <span className="site-appear">Factuur FAC-086</span> : open] },
      ]}
    />
  );
}

/** De drie stappen van een mailkoppeling: plug-in aanzetten, inbox, agenda */
function mailScenes(name: string, icon: ReactNode, description: string, calendarName: string): (() => ReactNode)[] {
  return [
    () => (
      <AppPage active="settings" title="Instellingen" actions={null}>
        <div className="block plugin-list">
          <PluginRow icon={icon} title={name} description={description} onAt={1.6} />
        </div>
        <Cursor path={[["toggle", 0.6]]} />
        <Toast at={2.6} title="Gekoppeld" message="Je mail en agenda staan nu in Synbased" />
      </AppPage>
    ),
    () => (
      <AppPage active="inbox" title="Inbox" actions={null}>
        <MailList
          mails={[
            { at: 0.3, from: 'Familie Verhoef', subject: 'Nieuwe vloer keuken en gang', preview: 'Goedemiddag, wij willen graag een nieuwe vloer…', time: '10:24', unread: true },
            { at: 0.6, from: 'Van Leeuwen Vastgoed', subject: 'Planning onderhoud voorjaar', preview: 'Kunnen we volgende week de planning doornemen?', time: '09:12', unread: true },
            { at: 0.9, from: 'M. de Graaf', subject: 'Re: Offerte OFF-116', preview: 'Dank voor de offerte, ik heb nog één vraag…', time: 'gisteren' },
          ]}
        />
      </AppPage>
    ),
    () => {
      const t = useT();
      return (
        <AppPage active="calendar" title="Agenda" actions={<Button id="new" pressAt={1.6}>Afspraak maken</Button>}>
          <div className="block site-week">
            {['Ma 20', 'Di 21', 'Wo 22', 'Do 23', 'Vr 24'].map((day, index) => (
              <div key={day}>
                <span className="placeholder">{day}</span>
                {index === 0 && <span className="site-event">08:00 Start badkamer J. Dekker</span>}
                {index === 3 && t >= 2 && <span data-demo="event" className="site-event site-appear">09:00 Opmeten Familie Verhoef</span>}
              </div>
            ))}
          </div>
          <Cursor path={[["new", 0.6]]} />
          <Toast at={2.2} title="Afspraak gemaakt" message={`Staat ook in ${calendarName}`} />
        </AppPage>
      );
    },
  ];
}

/**
 * Het blok zelf: de stappen links, het venster rechts. Het venster schaalt de
 * app passend mee, en de tijdlijn begint bij elke stap opnieuw.
 */
export default function ModuleDemo({ module }: { module: SiteModule }) {
  const scenes = SCENES[module.slug] || [];
  const [active, setActive] = useState(0);
  const [t, setT] = useState(0);
  const [fit, setFit] = useState(0.6);
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [reduced, setReduced] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setRoot(cameraRef.current);
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // De tijd per stap, bij een nieuwe stap weer vanaf nul
  useEffect(() => {
    if (reduced) {
      setT(99);
      return;
    }
    // Mee met de verversing van het scherm, zodat typen en tellen vloeiend lopen
    const started = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      setT((now - started) / 1000);
      frame = requestAnimationFrame(tick);
    });
    setT(0);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced]);

  // Na de tijd van een stap door naar de volgende
  useEffect(() => {
    const timer = setTimeout(() => setActive((current) => (current + 1) % module.steps.length), STEP_MS);
    return () => clearTimeout(timer);
  }, [active, module.steps.length]);

  // De app passend in het venster: verkleind tot de breedte die er is
  useEffect(() => {
    const element = screenRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setFit(element.clientWidth / BASE_WIDTH));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // De camera: het laatste punt op het pad dat al begonnen is
  const path = reduced ? [] : CAMERAS[module.slug]?.[active] || [];
  const shot = [...path].reverse().find(([, at]) => t >= at);
  const shotKey = shot ? `${shot[0]}-${shot[1]}` : 'all';
  // Staat het doel er nog niet (het verschijnt later), dan blijft de camera elke kwart seconde kijken
  const [waiting, setWaiting] = useState(false);
  const retry = waiting ? Math.floor(t * 4) : 0;

  useEffect(() => {
    if (!shot || !shot[0] || !root) {
      setWaiting(false);
      setCamera({ x: 0, y: 0, scale: 1 });
      return;
    }
    const element = root.querySelector<HTMLElement>(`[data-demo="${shot[0]}"]`);
    setWaiting(!element);
    if (!element) return;
    const box = positionIn(element, root);
    const scale = shot[2] || 1.6;
    // Het doel in het midden, maar nooit voorbij de rand van de app
    const x = Math.min(0, Math.max(BASE_WIDTH - BASE_WIDTH * scale, BASE_WIDTH / 2 - (box.x + box.width / 2) * scale));
    const y = Math.min(0, Math.max(APP_HEIGHT - APP_HEIGHT * scale, APP_HEIGHT / 2 - (box.y + box.height / 2) * scale));
    setCamera({ x, y, scale });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shotKey, root, active, retry]);

  const Scene = scenes[active];

  return (
    <div className="site-demo">
      <div className="site-demo-steps">
        {module.steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            className={`site-demo-step${index === active ? ' active' : ''}`}
            onClick={() => setActive(index)}
          >
            <span className="site-step">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            {index === active && (
              <span className="site-demo-progress">
                <span style={{ animationDuration: `${STEP_MS}ms` }} />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="site-window" aria-hidden="true">
        <div className="site-window-bar">
          <i />
          <i />
          <i />
          <span>synbased.com</span>
        </div>
        <div
          className="site-window-screen"
          ref={screenRef}
          // Zo hoog als de verkleinde app, zodat er niets wordt afgeknipt en niets leeg blijft
          style={{ height: Math.round(APP_HEIGHT * fit) }}
        >
          <div className="site-window-fit" style={{ transform: `scale(${fit})` }}>
            <div
              ref={cameraRef}
              className="site-camera"
              style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}
            >
              <DemoTime.Provider value={{ t, root }}>
                <Fragment key={active}>{Scene && <Scene />}</Fragment>
              </DemoTime.Provider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
