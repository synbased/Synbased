import type { DocumentBlock, DocumentElement, ElementKind, LineItem } from './supabase';
import { plainTextToRichText } from './richtext';

/** De elementtypes die een blok mag bevatten, gelijk aan de CHECK in de database. */
export const ELEMENT_KINDS: ElementKind[] = ['gegevens', 'kop', 'tekst', 'prijstabel', 'handtekening'];

/** Een verse prijsregel. */
export const emptyItem = (): LineItem => ({
  description: '',
  is_heading: false,
  quantity: 1,
  unit: null,
  price: 0,
});

/** Een verse tussenkop, bijvoorbeeld "Dakwerkzaamheden". */
export const emptyHeading = (): LineItem => ({
  description: '',
  is_heading: true,
  quantity: 0,
  unit: null,
  price: 0,
});

/** Een vers element van de gekozen soort. */
export const emptyElement = (kind: ElementKind): DocumentElement => ({
  kind,
  body: kind === 'tekst' || kind === 'kop' ? '' : null,
  tax_percentage: 21,
  discount_percentage: 0,
  show_quantity: false,
  vat_type: 'normal',
  items: kind === 'prijstabel' ? [emptyItem()] : [],
});

/** Of er in deze regels met aantallen of eenheden gewerkt wordt */
export const usesQuantities = (items: Pick<LineItem, 'is_heading' | 'unit' | 'quantity'>[]): boolean =>
  items.some(item => !item.is_heading && (!!item.unit || Number(item.quantity) !== 1));

/** Een prijstabel met deze regels; aantal en eenheid staan aan als de regels ze gebruiken */
export const priceTable = (items: LineItem[]): DocumentElement => ({
  ...emptyElement('prijstabel'),
  items,
  show_quantity: usesQuantities(items),
});

/** Een vers blok: één pagina met een titel en nog geen elementen. */
export const emptyBlock = (title = ''): DocumentBlock => ({
  title,
  elements: [],
});

/** De blokken waarmee een nieuwe offerte of factuur begint: één lege pagina. */
export const startBlocks = (): DocumentBlock[] => [emptyBlock()];

/** Maakt een kopie van één element, zonder database-ids. */
export function duplicateElement(element: DocumentElement): DocumentElement {
  return {
    kind: element.kind,
    body: element.body,
    tax_percentage: element.tax_percentage,
    discount_percentage: element.discount_percentage,
    show_quantity: element.show_quantity,
    vat_type: element.vat_type || 'normal',
    items: element.items.map(item => ({ ...item, id: undefined })),
  };
}

/** Maakt een kopie van een heel blok, inclusief alle elementen. */
export function duplicateBlock(block: DocumentBlock): DocumentBlock {
  return {
    title: block.title,
    elements: block.elements.map(duplicateElement),
  };
}

/**
 * Maakt van opgehaalde blokken een schone kopie zonder database-ids,
 * zodat ze als nieuw document opgeslagen kunnen worden.
 */
export function copyBlocks(blocks: any[] | null | undefined): DocumentBlock[] {
  return (blocks || []).map((block: any) => ({
    title: block.title || '',
    elements: (block.elements || []).map((element: any) => ({
      kind: element.kind || 'tekst',
      body: element.body ?? null,
      tax_percentage: Number(element.tax_percentage) || 0,
      discount_percentage: Number(element.discount_percentage) || 0,
      show_quantity: !!element.show_quantity,
      vat_type: element.vat_type || 'normal',
      items: (element.items || []).map((item: any) => ({
        description: item.description || '',
        is_heading: !!item.is_heading,
        quantity: Number(item.quantity) || 0,
        unit: item.unit || null,
        price: Number(item.price) || 0,
      })),
    })),
  }));
}

/**
 * Controleert de blokken zoals ze binnenkomen. Geeft een leesbare melding
 * terug bij een probleem, of null als alles klopt. Wordt zowel door de API
 * als door de schermen gebruikt, zodat de melding overal gelijk is.
 */
export function validateBlocks(blocks: unknown): string | null {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return 'Voeg minimaal één blok toe';
  }

  for (const block of blocks) {
    const elements = Array.isArray(block.elements) ? block.elements : [];

    for (const element of elements) {
      // Hetzelfde rijtje als de CHECK op quote_elements en invoice_elements
      if (!ELEMENT_KINDS.includes(element.kind)) {
        return `Onbekend elementtype "${element.kind}" in "${block.title || 'zonder naam'}"`;
      }

      if (element.kind !== 'prijstabel') continue;

      const items = Array.isArray(element.items) ? element.items : [];

      if (items.filter((item: any) => !item.is_heading).length === 0) {
        return `De prijstabel in "${block.title || 'zonder naam'}" heeft nog geen regels`;
      }

      if (items.some((item: any) => !item.description?.trim())) {
        return `Elke regel in "${block.title || 'zonder naam'}" heeft een omschrijving nodig`;
      }
    }
  }

  return null;
}

/** Een regel uit een AI-voorstel, zoals de Inbox en de WhatsApp-bot hem doorgeven */
export interface ProposalLine {
  description: string;
  quantity: number;
  unit: string;
  price?: number | null;
  section?: string;
  vat_rate?: number;
}

/**
 * De blokken van een offerte uit een AI-voorstel, in de opzet van een eerdere
 * offerte van het bedrijf. Die opzet (layout) geeft de pagina's, de teksten na
 * de prijstabel, de handtekening en de instellingen van de prijstabel; de
 * titel, de inleiding en de regels komen uit het voorstel. De regels staan per
 * btw-tarief in een eigen prijstabel, met een tussenkop per onderdeel.
 *
 * Zonder eerdere offerte: gegevens, inleiding, prijstabel en handtekening.
 */
export function proposalBlocks(
  proposal: { title: string; intro: string; items: ProposalLine[] },
  layout?: DocumentBlock[] | null
): DocumentBlock[] {
  const title = proposal.title.trim() || 'Offerte';
  const lines = proposal.items.filter(item => item.description.trim());
  const introElement = proposal.intro.trim() ? [{ ...emptyElement('tekst'), body: plainTextToRichText(proposal.intro) }] : [];

  // Een tussenkop zodra het onderdeel wisselt, als het voorstel onderdelen heeft
  const withSections = lines.some(item => item.section?.trim());
  const tables = (template?: DocumentElement): DocumentElement[] => {
    const rates = [...new Set(lines.map(item => (item.vat_rate === 9 || item.vat_rate === 0 ? item.vat_rate : 21)))].sort((a, b) => b - a);
    const groups = rates.length ? rates : [21];

    return groups.map(rate => {
      const rows: LineItem[] = [];
      let section: string | null = null;
      for (const item of lines.filter(line => (line.vat_rate === 9 || line.vat_rate === 0 ? line.vat_rate : 21) === rate)) {
        const next = item.section?.trim() || '';
        if (withSections && next && next !== section) rows.push({ ...emptyHeading(), description: next });
        section = next;
        rows.push({
          description: item.description.trim(),
          is_heading: false,
          quantity: Number(item.quantity) || 1,
          unit: item.unit.trim() || null,
          price: Number(item.price) || 0,
        });
      }
      if (rows.length === 0) rows.push({ ...emptyItem(), description: title });

      const table = priceTable(rows);
      return {
        ...table,
        tax_percentage: rate,
        // Werkt het bedrijf met aantallen, dan ook hier
        show_quantity: table.show_quantity || !!template?.show_quantity,
      };
    });
  };

  const main = (layout || []).findIndex(block => block.elements.some(element => element.kind === 'prijstabel'));
  if (!layout || main < 0) {
    return [{ title, elements: [emptyElement('gegevens'), ...introElement, ...tables(), emptyElement('handtekening')] }];
  }

  return layout.flatMap((block, index) => {
    if (index !== main) {
      // Andere pagina's, zoals de algemene voorwaarden, gaan mee; oude prijzen niet
      const elements = block.elements.filter(element => element.kind !== 'prijstabel').map(duplicateElement);
      return elements.length ? [{ title: block.title, elements }] : [];
    }

    const elements: DocumentElement[] = [];
    let placedTables = false;
    let placedIntro = false;
    let placedTitle = false;

    for (const element of block.elements) {
      if (element.kind === 'prijstabel') {
        if (placedTables) continue;
        // De inleiding staat voor de prijstabel, ook als de vorige offerte er geen had
        if (!placedIntro) elements.push(...introElement);
        placedIntro = true;
        elements.push(...tables(element));
        placedTables = true;
      } else if (!placedTables && element.kind === 'tekst') {
        // De inleiding van de vorige klus wordt de nieuwe
        if (!placedIntro) elements.push(...introElement);
        placedIntro = true;
      } else if (!placedTables && element.kind === 'kop') {
        // Een kop boven de prijstabel ging over de vorige klus; de eerste wordt de titel
        if (!placedTitle) elements.push({ ...duplicateElement(element), body: title });
        placedTitle = true;
      } else {
        elements.push(duplicateElement(element));
      }
    }

    // De klantgegevens bovenaan en een handtekening horen altijd op een offerte
    if (!elements.some(element => element.kind === 'gegevens')) elements.unshift(emptyElement('gegevens'));
    if (!layout.some(other => other.elements.some(element => element.kind === 'handtekening'))) {
      elements.push(emptyElement('handtekening'));
    }

    return [{ title, elements }];
  });
}
