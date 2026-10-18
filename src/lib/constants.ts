// Losse constanten zonder database-afhankelijkheden, zodat de browser
// deze kan importeren zonder de Supabase-client mee te nemen.

/** De naam van het systeem, zoals hij in het tabblad van de browser komt */
export const APP_NAME = 'Synbased';

/** "Offertes - Synbased". Zonder titel blijft alleen de naam over. */
export function pageTitle(title?: string): string {
  return title ? `${title} - ${APP_NAME}` : APP_NAME;
}

/**
 * Wat de inlogpagina terugkrijgt als het wachtwoord klopt maar er nog een
 * code uit de authenticator-app nodig is, of als die code niet klopt. NextAuth
 * geeft de tekst van een fout uit authorize door als `error`.
 */
export const TWO_FACTOR_REQUIRED = '2FA_REQUIRED';
export const TWO_FACTOR_INVALID = '2FA_INVALID';
/** Te vaak mis: dit account staat even op slot (zie lib/rate-limit) */
export const TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS';

/** Zo kort mag een nieuw wachtwoord minimaal zijn */
export const MIN_PASSWORD_LENGTH = 8;

/** De statussen van een offerte, met hun naam en hun kleur in de lijst. */
export const QUOTE_STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Concept', className: 'status-draft' },
  sent: { label: 'Verzonden', className: 'status-sent' },
  approved: { label: 'Goedgekeurd', className: 'status-paid' },
  rejected: { label: 'Afgewezen', className: 'status-cancelled' },
  expired: { label: 'Verlopen', className: 'status-cancelled' },
};

/** De statussen van een factuur, met hun naam en hun kleur in de lijst. */
export const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Concept', className: 'status-draft' },
  sent: { label: 'Verzonden', className: 'status-sent' },
  paid: { label: 'Betaald', className: 'status-paid' },
  cancelled: { label: 'Geannuleerd', className: 'status-cancelled' },
};

/** De fases van een project, met hun naam en hun kleur in de lijst */
export const PROJECT_STATUS: Record<string, { label: string; className: string }> = {
  quote: { label: 'Offerte', className: 'status-draft' },
  planned: { label: 'Gepland', className: 'status-draft' },
  active: { label: 'In uitvoering', className: 'status-sent' },
  completed: { label: 'Opgeleverd', className: 'status-paid' },
};

/** De statussen van een kostenpost */
export const EXPENSE_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'status-sent' },
  paid: { label: 'Betaald', className: 'status-paid' },
};

/**
 * Soorten kosten, elk met de grootboekrekening waar ze in de jaarcijfers op
 * komen. Bij eten en drinken mag de btw niet worden afgetrokken; die telt dan
 * als kosten in plaats van als voorbelasting.
 */
export const EXPENSE_CATEGORIES: { value: string; label: string; account: string; vatDeductible?: false }[] = [
  { value: 'materials', label: 'Inkoop materiaal', account: '7000' },
  { value: 'subcontracting', label: 'Onderaanneming', account: '7100' },
  { value: 'tools', label: 'Gereedschap en klein materiaal', account: '4500' },
  { value: 'vehicle', label: 'Auto en vervoer', account: '4300' },
  { value: 'fuel', label: 'Brandstof', account: '4310' },
  { value: 'housing', label: 'Huisvesting', account: '4200' },
  { value: 'office', label: 'Kantoorkosten', account: '4400' },
  { value: 'phone', label: 'Telefoon en internet', account: '4410' },
  { value: 'software', label: 'Software en abonnementen', account: '4420' },
  { value: 'marketing', label: 'Reclame en marketing', account: '4600' },
  { value: 'representation', label: 'Eten, drinken en relatiegeschenken', account: '4610', vatDeductible: false },
  { value: 'insurance', label: 'Verzekeringen', account: '4700' },
  { value: 'education', label: 'Opleiding', account: '4800' },
  { value: 'bank', label: 'Bankkosten', account: '4900' },
  { value: 'other', label: 'Overige kosten', account: '4990' },
];

/**
 * Wat een banktransactie kan zijn als er geen factuur of bon bij hoort, met
 * de grootboekrekening waar hij in de jaarcijfers op komt.
 */
export const BANK_CATEGORIES: { value: string; label: string; account: string }[] = [
  { value: 'private', label: 'Privé', account: '0600' },
  { value: 'tax', label: 'Belastingdienst (btw)', account: '1520' },
  { value: 'transfer', label: 'Overboeking of uitbetaling (zoals Mollie)', account: '2200' },
  { value: 'bank_costs', label: 'Bankkosten', account: '4900' },
  { value: 'other_income', label: 'Overige inkomsten', account: '8900' },
  { value: 'other_costs', label: 'Overige kosten zonder bon', account: '4990' },
];

/**
 * De soort btw op een verkoop, per prijstabel. Behalve gewoon is de btw 0 en
 * staat er een verplichte vermelding op de factuur; bij verlegd en EU ook het
 * btw-nummer van de klant. De rubriek is die op de btw-aangifte.
 */
export type SalesVatType = 'normal' | 'reverse_charge' | 'eu' | 'export';

export const SALES_VAT_TYPES: Record<Exclude<SalesVatType, 'normal'>, { label: string; note: string; rubric: string; needsVatNumber: boolean }> = {
  reverse_charge: { label: 'Btw verlegd', note: 'Btw verlegd', rubric: '1e', needsVatNumber: true },
  eu: { label: 'Intracommunautair (EU)', note: 'Intracommunautaire levering, btw verlegd', rubric: '3b', needsVatNumber: true },
  export: { label: 'Export buiten de EU', note: 'Export buiten de EU, 0% btw', rubric: '3a', needsVatNumber: false },
};

/**
 * De soort btw op een inkoop, per regel. Behalve gewoon betaal je de
 * leverancier geen btw, maar geef je hem zelf aan (en trek je hem weer af).
 */
export type PurchaseVatType = 'normal' | 'reverse_charge' | 'eu' | 'import';

export const PURCHASE_VAT_TYPES: Record<Exclude<PurchaseVatType, 'normal'>, { label: string; rubric: string }> = {
  reverse_charge: { label: 'Btw naar mij verlegd', rubric: '2a' },
  eu: { label: 'Inkoop uit de EU', rubric: '4b' },
  import: { label: 'Inkoop van buiten de EU', rubric: '4a' },
};

/** De btw-tarieven in Nederland */
export const VAT_RATES = [21, 9, 0] as const;

/** Eenheden waarin een aannemer regels uitschrijft */
export const UNITS = ['stuks', 'uur', 'dag', 'm', 'm²', 'm³', 'kg', 'ton', 'post'] as const;
