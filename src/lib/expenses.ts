import { EXPENSE_CATEGORIES, PURCHASE_VAT_TYPES, VAT_RATES } from './constants';
import type { ReceiptReading } from './ai/types';
import type { ExpenseLine } from './supabase';

/**
 * De regels rond een kostenpost, voor het scherm en de API allebei.
 *
 * Een kostenpost heeft een of meer regels, elk met een eigen btw-tarief, zoals
 * ze onderaan een bonnetje staan. De bedragen van de kostenpost zelf zijn
 * altijd de som van de regels. Een regel kan ook verlegde btw hebben (zie
 * PURCHASE_VAT_TYPES): dan betaal je de leverancier geen btw, maar geef je
 * hem zelf aan.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const cents = (amount: number) => Math.round(amount * 100) / 100;

/** De btw bij een bedrag exclusief btw, op centen */
export function vatFor(amountExcl: number, rate: number): number {
  return cents(((Number(amountExcl) || 0) * (Number(rate) || 0)) / 100);
}

/**
 * Rekent een gelezen bon na tegen het totaal dat erop staat. Een AI haalt
 * soms het subtotaal en het totaal door elkaar, of zet een bedrag inclusief
 * btw neer als exclusief. Wat zeker te herstellen is, wordt hersteld; blijft
 * het niet kloppen, dan zegt total_matches dat de gebruiker moet kijken.
 */
export function checkReceiptTotal(reading: ReceiptReading): ReceiptReading & { total_matches: boolean } {
  const total = cents(Number(reading.total_incl) || 0);
  const lines = reading.lines;
  const sum = (list: typeof lines) => cents(list.reduce((s, line) => s + line.amount_excl + line.vat_amount, 0));
  // Per regel kan de afronding een cent schelen
  const fits = (list: typeof lines) => Math.abs(sum(list) - total) <= 0.02 * Math.max(list.length, 1);
  const vatFits = (line: (typeof lines)[number], excl = line.amount_excl) =>
    line.vat_type !== 'normal' || Math.abs(vatFor(excl, line.vat_rate) - line.vat_amount) <= 0.02;

  if (total <= 0 || lines.length === 0 || fits(lines)) return { ...reading, total_matches: true };

  // Het bedrag inclusief btw als exclusief: zonder de btw klopt het tarief wel
  const corrected = lines.map(line =>
    !vatFits(line) && vatFits(line, cents(line.amount_excl - line.vat_amount))
      ? { ...line, amount_excl: cents(line.amount_excl - line.vat_amount) }
      : line
  );
  if (fits(corrected)) return { ...reading, lines: corrected, total_matches: true };

  // Eén regel die niet klopt, of maar één regel: die volgt uit het totaal min de rest
  const suspect = lines.length === 1 ? [0] : lines.flatMap((line, i) => (vatFits(line) ? [] : [i]));
  if (suspect.length === 1) {
    const i = suspect[0];
    const others = sum(lines.filter((_, j) => j !== i));
    const excl = cents(total - others - lines[i].vat_amount);
    if (excl > 0 && (lines.length === 1 || vatFits(lines[i], excl))) {
      return { ...reading, lines: lines.map((line, j) => (j === i ? { ...line, amount_excl: excl } : line)), total_matches: true };
    }
  }

  return { ...reading, total_matches: false };
}

/** De naam van een categorie, of de code zelf als hij niet (meer) bestaat */
export function categoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find(c => c.value === value)?.label || value;
}

/** Of de btw van deze categorie als voorbelasting mag; bij eten en drinken niet */
export function isVatDeductible(category: string): boolean {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.vatDeductible !== false;
}

/**
 * De velden en regels uit een verzoek, gecontroleerd. Geeft een melding als er
 * iets niet klopt; die is voor de gebruiker.
 */
export function expenseFromBody(body: any): {
  fields: Record<string, any>;
  lines?: ExpenseLine[];
  problem?: string;
} {
  const fields: Record<string, any> = {};

  if (!String(body?.supplier || '').trim()) return { fields, problem: 'Vul de leverancier in' };
  if (!DATE.test(String(body?.expense_date || ''))) return { fields, problem: 'Vul de datum in' };

  fields.supplier = String(body.supplier).trim();
  fields.expense_date = body.expense_date;
  fields.reference = String(body.reference || '').trim() || null;
  fields.description = String(body.description || '').trim() || null;
  fields.due_date = DATE.test(String(body.due_date || '')) ? body.due_date : null;
  fields.category = EXPENSE_CATEGORIES.some(c => c.value === body.category) ? body.category : 'other';
  fields.project_id = Number(body.project_id) > 0 ? Number(body.project_id) : null;
  fields.status = body.status === 'paid' ? 'paid' : 'open';
  fields.paid_at = fields.status === 'paid' ? (DATE.test(String(body.paid_at || '')) ? body.paid_at : body.expense_date) : null;

  const lines: ExpenseLine[] = (Array.isArray(body.lines) ? body.lines : [])
    .map((line: any) => ({
      description: String(line?.description || ''),
      amount_excl: cents(Number(line?.amount_excl) || 0),
      vat_rate: (VAT_RATES as readonly number[]).includes(Number(line?.vat_rate)) ? Number(line.vat_rate) : 21,
      vat_amount: cents(Number(line?.vat_amount) || 0),
      vat_type: line?.vat_type in PURCHASE_VAT_TYPES ? line.vat_type : 'normal',
    }))
    .filter((line: ExpenseLine) => line.amount_excl !== 0 || line.vat_amount !== 0);

  if (lines.length === 0) return { fields, problem: 'Vul een bedrag in' };

  return { fields, lines };
}
