import type { ReactElement } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChartColumn,
  FilePen,
  FileSignature,
  Landmark,
  LayoutDashboard,
  Package,
  Percent,
  Receipt,
  ReceiptEuro,
  Sparkles,
  Users,
  FolderKanban,
  type LucideIcon,
} from 'lucide-react';
import { GoogleIcon, MicrosoftIcon, MollieIcon, WhatsAppIcon } from '@/components/BrandIcons';

/**
 * De modules van Synbased voor de website: wat er standaard in zit en welke
 * plug-ins je erbij aanzet. Eén lijst voor het overzicht op /modules en de
 * detailpagina's op /modules/[slug].
 *
 * Alleen wat Synbased echt kan; komt er een module bij, zet hem dan hier.
 * ModuleCell onderaan is het blok in het raster, op beide pagina's.
 */

export interface SiteModule {
  slug: string;
  name: string;
  /** Standaard in het abonnement, of een plug-in die je bij Instellingen aanzet */
  kind: 'standard' | 'plugin';
  /** Waar hij in het overzicht onder staat */
  group: string;
  icon: LucideIcon | ((props: { size?: number }) => ReactElement);
  /** Eén regel voor het blok in het overzicht */
  summary: string;
  /** Twee of drie zinnen bovenaan de detailpagina */
  lead: string;
  features: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  /** Feitjes in de kaart naast de kop */
  facts: { label: string; value: string }[];
  /** Een schermafbeelding uit public/screens, als die er is */
  screenshot?: { src: string; alt: string; width: number; height: number };
  related: string[];
}

export const MODULE_GROUPS = ['Verkoop', 'Financiën', 'Overzicht', 'E-mail en agenda', 'Berichten en AI', 'Betalen en bank'];

export const MODULES: SiteModule[] = [
  {
    slug: 'quotes',
    name: 'Offertes',
    kind: 'standard',
    group: 'Verkoop',
    icon: FileSignature,
    summary: 'Offertes in je eigen huisstijl, online laten tekenen en vanzelf opvolgen.',
    lead: 'Maak een offerte met je vaste producten, verstuur hem met één klik en laat je klant online tekenen met vinger of muis. Je ziet wanneer hij hem opent, en Synbased stuurt zelf een herinnering als het even duurt.',
    features: [
      { title: 'Online ondertekenen', text: 'Je klant opent de offerte via een knop in de mail en tekent direct. De handtekening staat op de offerte.' },
      { title: 'Geopend door de klant', text: 'Je ziet wanneer en hoe vaak de offerte bekeken is, zodat je weet wanneer je kunt bellen.' },
      { title: 'Vanzelf een herinnering', text: 'Nog niet getekend na het aantal dagen dat jij kiest? Dan gaat er één vriendelijke herinnering.' },
      { title: 'Eigen opmaak', text: 'Je logo, je kleuren en desnoods je eigen sjabloon, staand of liggend A4, met meerdere btw-tarieven.' },
    ],
    steps: [
      { title: 'Maak de offerte', text: 'Zelf, vanuit een mail met AI, of met een WhatsApp-bericht vanaf de bouwplaats.' },
      { title: 'Verstuur hem', text: 'Vanuit je eigen Gmail of Outlook, met een knop naar de offerte.' },
      { title: 'Je klant tekent online', text: 'Met zijn vinger of muis, op de pagina van de offerte. Jij ziet het meteen.' },
      { title: 'Zet om naar een factuur', text: 'Getekend? Met één knop wordt het een factuur, met alle regels erin.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Facturen, Producten, Klanten' },
    ],
    screenshot: { src: '/screens/quote.webp', alt: 'Een ondertekende offerte zoals de klant hem ziet', width: 818, height: 800 },
    related: ['invoices', 'products', 'ai'],
  },
  {
    slug: 'invoices',
    name: 'Facturen',
    kind: 'standard',
    group: 'Verkoop',
    icon: ReceiptEuro,
    summary: 'Facturen met QR-code, doorlopende nummers, creditfacturen en betalingsherinneringen.',
    lead: 'Verstuur een factuur met de betaalgegevens en een QR-code voor de bank-app. De nummering loopt altijd door zoals de Belastingdienst wil, een verstuurde factuur ligt vast, en wie te laat is krijgt vanzelf een herinnering.',
    features: [
      { title: 'QR-code voor de bank-app', text: 'Je klant scant en betaalt; bedrag, IBAN en omschrijving staan er al in.' },
      { title: 'Volgens de regels', text: 'Een nummer pas bij versturen, dus nooit een gat in de reeks. Corrigeren gaat met een creditfactuur.' },
      { title: 'Betalingsherinneringen', text: 'Over de vervaldatum? Na het aantal dagen dat jij kiest een herinnering, en daarna nog één.' },
      { title: 'Eigen nummering', text: 'Met een jaartal, letters of gewoon doorlopend; het systeem telt zelf verder.' },
    ],
    steps: [
      { title: 'Maak de factuur', text: 'Vanuit een getekende offerte of los, met je vaste producten.' },
      { title: 'Verstuur hem', text: 'De factuur krijgt zijn nummer en gaat met betaalgegevens en QR-code naar je klant.' },
      { title: 'Krijg betaald', text: 'Via de bank-app of iDEAL; met de bankkoppeling staat hij vanzelf op betaald.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Offertes, Mollie, Bank' },
    ],
    screenshot: { src: '/screens/payment.webp', alt: 'Het betaalblok op een factuur met een QR-code voor de bank-app', width: 600, height: 270 },
    related: ['quotes', 'mollie', 'bank'],
  },
  {
    slug: 'customers',
    name: 'Klanten',
    kind: 'standard',
    group: 'Verkoop',
    icon: Users,
    summary: 'Alle gegevens van je klanten, met hun offertes en notities bij elkaar.',
    lead: 'Particulier of bedrijf: naam, adres, KvK, btw-nummer en IBAN op één plek. Bij elke klant zie je zijn offertes en notities, zodat je weet wat je hebt afgesproken.',
    features: [
      { title: 'Particulier en zakelijk', text: 'Met contactgegevens, adres, KvK, btw-nummer en IBAN.' },
      { title: 'Alles bij de klant', text: 'Zijn offertes en notities onder tabbladen, met één klik te openen.' },
      { title: 'Klantnummers', text: 'Een eigen klantnummer per klant, ook in de keuzelijsten.' },
      { title: 'Snel gevonden', text: 'Zoeken op naam, bedrijf of e-mailadres.' },
    ],
    steps: [
      { title: 'Voeg de klant toe', text: 'Met de hand, of vanzelf uit een mail of WhatsApp-bericht met AI.' },
      { title: 'Maak een offerte', text: 'Kies de klant; zijn gegevens staan meteen op de offerte.' },
      { title: 'Houd bij wat er speelt', text: 'Notities, offertes en facturen bij elkaar.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Offertes, Notities' },
    ],
    related: ['notes', 'quotes', 'ai'],
  },
  {
    slug: 'projects',
    name: 'Projecten',
    kind: 'standard',
    group: 'Verkoop',
    icon: FolderKanban,
    summary: 'Per klus de offerte, facturen, bonnen en notities bij elkaar, met je marge.',
    lead: 'Maak een project per klus, zoals "Badkamer Familie Verhoef". Je ziet wat er geoffreerd, gefactureerd en uitgegeven is, en wat je eraan overhoudt. Grote klussen factureer je in termijnen.',
    features: [
      { title: 'Alles bij de klus', text: 'Offertes, facturen, bonnen en notities op één plek, met de klant en het adres.' },
      { title: 'Marge per project', text: 'Gefactureerd min kosten, exclusief btw, zodat je ziet wat een klus oplevert.' },
      { title: 'Termijnfacturen', text: 'Factureer een deel van de offerte, zoals 30% vooraf, met de juiste btw.' },
      { title: 'Fases', text: 'Van offerte via gepland en in uitvoering tot opgeleverd.' },
    ],
    steps: [
      { title: 'Maak het project', text: 'Kies de klant en zet de offerte erbij.' },
      { title: 'Leg de termijnen vast', text: 'Zoals 30% bij opdracht, 50% halverwege en 20% bij oplevering; per termijn één klik op Factureren.' },
      { title: 'Zie je marge', text: 'Bonnen bij het project komen van de omzet af.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Offertes, Facturen, Kosten, Notities' },
    ],
    related: ['quotes', 'invoices', 'expenses'],
  },
  {
    slug: 'products',
    name: 'Producten',
    kind: 'standard',
    group: 'Verkoop',
    icon: Package,
    summary: 'Je vaste prijzen voor werk en materiaal, te kiezen terwijl je typt.',
    lead: 'Uurloon, m² tegelwerk, voorrijkosten: zet ze één keer neer met prijs en eenheid. In de offerte komen ze als suggestie terwijl je typt, en een latere prijswijziging verandert geen oude offertes.',
    features: [
      { title: 'Prijs en eenheid', text: 'Per stuk, uur, m², m³ of post, exclusief btw.' },
      { title: 'Suggesties tijdens het typen', text: 'Typ een omschrijving en kies het product; de prijs staat er meteen.' },
      { title: 'Oude offertes blijven gelijk', text: 'Een regel krijgt een kopie, dus een nieuwe prijs geldt alleen voor nieuw werk.' },
      { title: 'Ook voor de AI', text: 'De AI gebruikt je eerdere prijzen bij een voorstel uit een mail.' },
    ],
    steps: [
      { title: 'Zet je prijzen neer', text: 'Eén keer, bij Producten.' },
      { title: 'Kies ze in de offerte', text: 'Typ en kies; aantal erbij en klaar.' },
      { title: 'Pas aan wanneer je wilt', text: 'Nieuwe prijzen gelden vanaf de volgende offerte.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Offertes, Facturen' },
    ],
    related: ['quotes', 'invoices', 'ai'],
  },
  {
    slug: 'expenses',
    name: 'Kosten',
    kind: 'standard',
    group: 'Financiën',
    icon: Receipt,
    summary: 'Bonnetjes en inkoopfacturen bewaren; met AI vanzelf ingevuld.',
    lead: 'Maak een foto van je bon of upload de inkoopfactuur. Met een AI-plug-in staan leverancier, datum, bedragen en btw er vanzelf in. Het bestand blijft zeven jaar veilig bewaard, zoals de bewaarplicht vraagt.',
    features: [
      { title: 'Foto of PDF', text: 'Van de bouwmarkt, de groothandel of een abonnement; alles op één plek.' },
      { title: 'Vanzelf ingevuld', text: 'Met een AI-plug-in leest Synbased de bon uit; jij controleert en slaat op.' },
      { title: 'Btw per tarief', text: 'Regels per tarief, zoals onderaan de bon. Btw op eten en drinken telt niet als voorbelasting.' },
      { title: 'Veilig bewaard', text: 'Afgeschermd opgeslagen; alleen jij komt erbij.' },
    ],
    steps: [
      { title: 'Upload de bon', text: 'Een foto met je telefoon of de PDF uit je mail.' },
      { title: 'Controleer', text: 'Leverancier, categorie en bedragen staan er al; pas aan wat nodig is.' },
      { title: 'Klaar voor de aangifte', text: 'De btw telt mee als voorbelasting in je btw-aangifte.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen; AI met je eigen sleutel' },
      { label: 'Werkt met', value: 'Btw-aangifte, Bank, AI' },
    ],
    related: ['vat', 'bank', 'ai'],
  },
  {
    slug: 'bank',
    name: 'Bank',
    kind: 'standard',
    group: 'Financiën',
    icon: Landmark,
    summary: 'Je bankafschrift inlezen; betalingen worden vanzelf aan facturen gekoppeld.',
    lead: 'Importeer een afschrift uit je bank-app. Betaalt een klant, dan staat zijn factuur vanzelf op betaald; betaal jij een leverancier, dan de kostenpost. Wat overblijft deel je in, zoals privé of bankkosten.',
    features: [
      { title: 'Elke Nederlandse bank', text: 'CAMT.053 of MT940, zoals ING, Rabobank, ABN AMRO, bunq en Knab ze leveren.' },
      { title: 'Vanzelf gekoppeld', text: 'Alleen als het zeker is: hetzelfde bedrag en het factuurnummer in de omschrijving.' },
      { title: 'Te verwerken', text: 'De rest koppel je met één keuze aan een factuur, kostenpost of categorie.' },
      { title: 'Saldo per rekening', text: 'Altijd zien wat er staat, voor elke zakelijke rekening.' },
    ],
    steps: [
      { title: 'Download een afschrift', text: 'In je bank-app of internetbankieren.' },
      { title: 'Importeer het', text: 'Dubbele transacties worden overgeslagen.' },
      { title: 'Verwerk wat overblijft', text: 'Koppelen of indelen, zodat je jaarcijfers kloppen.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Facturen, Kosten, Bankkoppeling' },
    ],
    related: ['bank-connection', 'invoices', 'reports'],
  },
  {
    slug: 'vat',
    name: 'Btw-aangifte',
    kind: 'standard',
    group: 'Financiën',
    icon: Percent,
    summary: 'Je btw-aangifte per kwartaal, rubriek voor rubriek klaar om over te nemen.',
    lead: 'Synbased rekent je aangifte uit zoals in Mijn Belastingdienst Zakelijk: omzet en btw per tarief, de voorbelasting uit je kosten, en wat je betaalt of terugkrijgt. Met een export voor je boekhouder.',
    features: [
      { title: 'Rubriek voor rubriek', text: '1a, 1b, 1c en 1e, 5a en 5b, en het bedrag om te betalen of terug te vragen.' },
      { title: 'Op factuurdatum', text: 'Zoals de aangifte werkt; creditfacturen tellen als min-bedrag.' },
      { title: 'Met voorbelasting', text: 'De btw op je kosten gaat er vanzelf af.' },
      { title: 'Export voor de boekhouder', text: 'Alle facturen en kosten van het kwartaal in één CSV.' },
    ],
    steps: [
      { title: 'Kies het kwartaal', text: 'Standaard het vorige: daar doe je nu aangifte over.' },
      { title: 'Controleer', text: 'Daaronder staan de facturen en kosten waar het uit komt.' },
      { title: 'Neem het over', text: 'In Mijn Belastingdienst Zakelijk, of stuur de export naar je boekhouder.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Facturen, Kosten' },
    ],
    related: ['expenses', 'reports', 'invoices'],
  },
  {
    slug: 'reports',
    name: 'Jaarcijfers',
    kind: 'standard',
    group: 'Financiën',
    icon: ChartColumn,
    summary: 'Winst-en-verlies en balans per jaar, zonder zelf te boekhouden.',
    lead: 'Synbased houdt onder water een complete boekhouding bij uit je facturen, kosten en bank. Je ziet je winst-en-verliesrekening en balans per jaar, en je boekhouder krijgt het grootboek als export.',
    features: [
      { title: 'Winst-en-verliesrekening', text: 'Omzet per tarief en kosten per categorie, met je winst.' },
      { title: 'Balans', text: 'Bank, debiteuren, crediteuren, btw en eigen vermogen op 31 december.' },
      { title: 'Altijd kloppend', text: 'Dubbel boekhouden onder water, afgeleid uit wat er al in Synbased staat.' },
      { title: 'Grootboek als export', text: 'Elke boeking met datum, rekening en bron, voor je boekhouder.' },
    ],
    steps: [
      { title: 'Werk gewoon door', text: 'Facturen, kosten en bank vullen de boekhouding vanzelf.' },
      { title: 'Kies het jaar', text: 'Winst-en-verlies en balans staan klaar.' },
      { title: 'Deel met je boekhouder', text: 'Exporteer het grootboek voor de jaarafsluiting.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Facturen, Kosten, Bank' },
    ],
    related: ['vat', 'bank', 'expenses'],
  },
  {
    slug: 'dashboard',
    name: 'Dashboard',
    kind: 'standard',
    group: 'Overzicht',
    icon: LayoutDashboard,
    summary: 'In één oogopslag wat er openstaat, wat te laat is en wat je verdient.',
    lead: 'Te ontvangen, verlopen, openstaande offertes en hoeveel er wordt goedgekeurd. Daaronder je omzet per dag, maand of jaar, betaald en nog niet betaald.',
    features: [
      { title: 'Wat openstaat', text: 'Facturen die wachten op betaling en offertes die nog niet getekend zijn.' },
      { title: 'Wat te laat is', text: 'Facturen over de vervaldatum, zodat je weet wie je moet bellen.' },
      { title: 'Omzetgrafiek', text: 'Gerealiseerd en ongerealiseerd, per periode.' },
      { title: 'Snel aan de slag', text: 'Een offerte of factuur maken staat bovenaan.' },
    ],
    steps: [
      { title: 'Log in', text: 'Het dashboard is je startpagina.' },
      { title: 'Zie wat aandacht nodig heeft', text: 'Openstaand en verlopen bovenaan.' },
      { title: 'Klik door', text: 'Elke offerte en factuur is één klik verder.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Offertes, Facturen' },
    ],
    screenshot: { src: '/screens/dashboard.webp', alt: 'Het dashboard van Synbased met openstaande offertes, facturen en de omzet', width: 1680, height: 1070 },
    related: ['invoices', 'quotes', 'reports'],
  },
  {
    slug: 'notes',
    name: 'Notities',
    kind: 'standard',
    group: 'Overzicht',
    icon: FilePen,
    summary: 'Maten, afspraken en details per klant, opgemaakt en terug te vinden.',
    lead: 'Schrijf op wat je bij de klant hebt opgemeten of afgesproken, met koppen en lijstjes. De notitie staat bij de klant, zodat je hem bij de offerte terugvindt.',
    features: [
      { title: 'Opgemaakte tekst', text: 'Koppen, lijstjes en vet, zoals je gewend bent.' },
      { title: 'Bij de klant', text: 'Onder het tabblad Notities van elke klant.' },
      { title: 'Zoeken', text: 'In titels, tekst en klantnamen.' },
      { title: 'Altijd bij de hand', text: 'Ook op je telefoon, in de browser.' },
    ],
    steps: [
      { title: 'Maak een notitie', text: 'Vanuit Notities of direct bij de klant.' },
      { title: 'Schrijf op wat telt', text: 'Maten, wensen, afspraken.' },
      { title: 'Vind hem terug', text: 'Bij de klant of via zoeken.' },
    ],
    facts: [
      { label: 'Soort', value: 'Standaard' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Klanten' },
    ],
    related: ['customers', 'quotes', 'whatsapp'],
  },
  {
    slug: 'google',
    name: 'Gmail en Google Agenda',
    kind: 'plugin',
    group: 'E-mail en agenda',
    icon: GoogleIcon,
    summary: 'Je Gmail en agenda in Synbased; offertes en facturen vanaf je eigen adres.',
    lead: 'Koppel je Google-account en lees, beantwoord en plan zonder te wisselen tussen programma’s. Offertes en facturen gaan vanaf je eigen adres de deur uit en staan in je Verzonden.',
    features: [
      { title: 'Inbox in Synbased', text: 'Lezen, beantwoorden, doorsturen en archiveren.' },
      { title: 'Agenda', text: 'Je afspraken bekijken en nieuwe inplannen.' },
      { title: 'Vanaf je eigen adres', text: 'Offertes, facturen en herinneringen gaan via je eigen Gmail.' },
      { title: 'Niet bij ons bewaard', text: 'Je mail wordt elke keer bij Google opgehaald.' },
    ],
    steps: [
      { title: 'Zet de plug-in aan', text: 'Bij Instellingen > Plug-ins.' },
      { title: 'Log in bij Google', text: 'In een venster van Google zelf.' },
      { title: 'Klaar', text: 'Inbox en Agenda staan in het menu.' },
    ],
    facts: [
      { label: 'Soort', value: 'Plug-in' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Gmail, Google Agenda' },
    ],
    screenshot: { src: '/screens/inbox.webp', alt: 'De inbox in Synbased met een aanvraag die je omzet naar een offerte', width: 1200, height: 602 },
    related: ['microsoft', 'ai', 'quotes'],
  },
  {
    slug: 'microsoft',
    name: 'Outlook',
    kind: 'plugin',
    group: 'E-mail en agenda',
    icon: MicrosoftIcon,
    summary: 'Je Outlook-mail en -agenda in Synbased, voor Microsoft 365 en Outlook.com.',
    lead: 'Koppel je Microsoft-account en werk met je mail en agenda in Synbased. Voor een zakelijk Microsoft 365-account kan je IT-beheerder de koppeling in één keer goedkeuren voor het hele bedrijf.',
    features: [
      { title: 'Inbox in Synbased', text: 'Lezen, beantwoorden, doorsturen en archiveren.' },
      { title: 'Agenda', text: 'Je afspraken bekijken en nieuwe inplannen.' },
      { title: 'Vanaf je eigen adres', text: 'Offertes, facturen en herinneringen gaan via je eigen Outlook.' },
      { title: 'Goedkeuring door de beheerder', text: 'Met een link die je IT-beheerder één keer opent.' },
    ],
    steps: [
      { title: 'Zet de plug-in aan', text: 'Bij Instellingen > Plug-ins.' },
      { title: 'Log in bij Microsoft', text: 'In een venster van Microsoft zelf.' },
      { title: 'Klaar', text: 'Inbox en Agenda staan in het menu.' },
    ],
    facts: [
      { label: 'Soort', value: 'Plug-in' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Microsoft 365, Outlook.com' },
    ],
    screenshot: { src: '/screens/inbox.webp', alt: 'De inbox in Synbased met een aanvraag die je omzet naar een offerte', width: 1200, height: 602 },
    related: ['google', 'ai', 'quotes'],
  },
  {
    slug: 'whatsapp',
    name: 'WhatsApp',
    kind: 'plugin',
    group: 'Berichten en AI',
    icon: WhatsAppIcon,
    summary: 'Een offerte maken met één WhatsApp-bericht, vanaf de bouwplaats.',
    lead: 'Stuur de bot van Synbased een bericht met wat je ziet en meet, in steekwoorden. Als je thuis bent staat de conceptofferte klaar, met de klant en de regels erin.',
    features: [
      { title: 'In steekwoorden', text: '"Keuken 45m2 tegels eruit, vloerverwarming" is genoeg.' },
      { title: 'Klant erbij', text: 'Een bekende klant wordt herkend; een nieuwe wordt aangemaakt.' },
      { title: 'Met je eigen prijzen', text: 'De AI gebruikt de prijzen uit je eerdere offertes.' },
      { title: 'Altijd een concept', text: 'Je controleert de offerte voor hij naar de klant gaat.' },
    ],
    steps: [
      { title: 'Koppel je nummer', text: 'Bij Instellingen > Plug-ins, met je eigen mobiele nummer.' },
      { title: 'Stuur een bericht', text: 'Vanaf de bouwplaats aan de bot.' },
      { title: 'Controleer en verstuur', text: 'De offerte staat als concept in Synbased.' },
    ],
    facts: [
      { label: 'Soort', value: 'Plug-in' },
      { label: 'Kosten', value: 'Inbegrepen; AI met je eigen sleutel' },
      { label: 'Werkt met', value: 'Offertes, AI' },
    ],
    related: ['ai', 'quotes', 'customers'],
  },
  {
    slug: 'ai',
    name: 'AI-assistent',
    kind: 'plugin',
    group: 'Berichten en AI',
    icon: Sparkles,
    summary: 'Van mail naar offerte, en bonnetjes vanzelf uitgelezen. Met Claude, OpenAI of Gemini.',
    lead: 'Koppel je eigen sleutel van Anthropic, OpenAI of Google Gemini. Een aanvraag in je inbox wordt met één klik een conceptofferte met prijzen uit je eerdere werk, en een foto van je bon vult je kostenpost vanzelf in.',
    features: [
      { title: 'Van mail naar offerte', text: 'Klant, regels en prijzen uit de mail, en een antwoord als er iets ontbreekt.' },
      { title: 'Bonnetjes lezen', text: 'Leverancier, datum, bedragen en btw van een foto of PDF.' },
      { title: 'Je eigen prijzen', text: 'Gebaseerd op wat je eerder rekende; nooit verzonnen.' },
      { title: 'Jouw keuze', text: 'Claude, OpenAI of Gemini; Gemini heeft een gratis laag om te proberen.' },
    ],
    steps: [
      { title: 'Kies je AI', text: 'Bij Instellingen > Plug-ins, met je eigen API-sleutel.' },
      { title: 'Gebruik hem', text: 'In de Inbox bij een aanvraag, of bij een nieuwe kostenpost.' },
      { title: 'Controleer', text: 'Het is altijd een voorstel; jij beslist.' },
    ],
    facts: [
      { label: 'Soort', value: 'Plug-in' },
      { label: 'Kosten', value: 'Per gebruik bij je AI-dienst' },
      { label: 'Werkt met', value: 'Anthropic, OpenAI, Google Gemini' },
    ],
    related: ['expenses', 'whatsapp', 'google'],
  },
  {
    slug: 'mollie',
    name: 'Mollie',
    kind: 'plugin',
    group: 'Betalen en bank',
    icon: MollieIcon,
    summary: 'Je klant betaalt direct met iDEAL; de factuur staat vanzelf op betaald.',
    lead: 'Met Mollie komt er een betaalknop op de factuurpagina van je klant. Hij betaalt in een paar tikken met iDEAL, en de factuur staat daarna vanzelf op betaald. Het geld gaat rechtstreeks naar je eigen rekening.',
    features: [
      { title: 'Nu betalen', text: 'Een betaalknop met iDEAL, Bancontact en meer.' },
      { title: 'Vanzelf op betaald', text: 'Met de juiste datum, zonder iets bij te houden.' },
      { title: 'Je eigen rekening', text: 'Synbased komt niet aan het geld.' },
      { title: 'Eerst proberen', text: 'Met een testsleutel wordt er niet echt betaald.' },
    ],
    steps: [
      { title: 'Maak een Mollie-account', text: 'Met je KvK-nummer en rekening, in een paar minuten.' },
      { title: 'Plak je sleutel', text: 'Bij Instellingen > Plug-ins.' },
      { title: 'Krijg sneller betaald', text: 'Elke factuur heeft de betaalknop.' },
    ],
    facts: [
      { label: 'Soort', value: 'Plug-in' },
      { label: 'Kosten', value: 'Per betaling bij Mollie, iDEAL rond € 0,30' },
      { label: 'Werkt met', value: 'Facturen' },
    ],
    related: ['invoices', 'bank-connection', 'bank'],
  },
  {
    slug: 'bank-connection',
    name: 'Bankkoppeling',
    kind: 'plugin',
    group: 'Betalen en bank',
    icon: Landmark,
    summary: 'Je transacties elke ochtend vanzelf binnen, zonder afschrift te downloaden.',
    lead: 'Geef bij je eigen bank toestemming en Synbased haalt elke ochtend je transacties op. Betalingen van klanten staan dan vanzelf bij hun factuur. Synbased kan alleen lezen: er kan nooit geld van je rekening af.',
    features: [
      { title: 'Elke ochtend opgehaald', text: 'En wanneer je wilt met "Nu ophalen".' },
      { title: 'Vanzelf gekoppeld', text: 'Een factuur staat op betaald zodra het geld binnen is.' },
      { title: 'Alleen lezen', text: 'Via PSD2 en GoCardless, onder vergunning.' },
      { title: '90 dagen toestemming', text: 'Daarna vraagt je bank het opnieuw; zo houd jij de regie.' },
    ],
    steps: [
      { title: 'Kies je bank', text: 'Bij Instellingen > Plug-ins.' },
      { title: 'Geef toestemming', text: 'Bij je eigen bank, met je eigen inlog.' },
      { title: 'Klaar', text: 'Je transacties staan bij Bank.' },
    ],
    facts: [
      { label: 'Soort', value: 'Plug-in' },
      { label: 'Kosten', value: 'Inbegrepen' },
      { label: 'Werkt met', value: 'Nederlandse banken via GoCardless' },
    ],
    related: ['bank', 'invoices', 'reports'],
  },
];

export function findModule(slug: string): SiteModule | undefined {
  return MODULES.find(module => module.slug === slug);
}

/** Eén blok in het raster; een klik opent de detailpagina */
export function ModuleCell({ module }: { module: SiteModule }) {
  const Icon = module.icon;
  return (
    <Link href={`/modules/${module.slug}`} className="site-grid-cell">
      <Icon size={20} />
      <h3>{module.name}</h3>
      <p>{module.summary}</p>
      <span className="site-more">
        Meer over {module.name} <ArrowRight size={13} />
      </span>
    </Link>
  );
}

/**
 * De uitleg per module voor de website: hoe het precies werkt, in een paar
 * onderwerpen (met stappen waar dat helpt), en de vragen die mensen erover
 * hebben. Staat onder de demo op /modules/[slug]. Alleen wat Synbased echt
 * doet, met de namen van de knoppen zoals ze in de app staan.
 */
export interface ModuleGuide {
  topics: { title: string; text: string; steps?: string[] }[];
  faq: { q: string; a: string }[];
}

export const MODULE_GUIDES: Record<string, ModuleGuide> = {
  quotes: {
    topics: [
      {
        title: 'Een offerte maken',
        text: 'Een offerte bestaat uit pagina’s met onderdelen: je gegevens en die van de klant, koppen, vrije tekst, prijstabellen en een vak om te tekenen. Elke prijstabel heeft een eigen btw-tarief, zodat bijvoorbeeld 9% schilderwerk en 21% materiaal naast elkaar kunnen.',
        steps: [
          'Kies bij Offertes "Offerte maken" en selecteer de klant.',
          'Typ de regels in de prijstabel. Typ je een omschrijving, dan stelt Synbased je vaste producten voor, met prijs en eenheid.',
          'Je ziet meteen hoe de offerte op papier komt, in je eigen huisstijl. Alles wordt tussendoor vanzelf bewaard.',
        ],
      },
      {
        title: 'Versturen en laten tekenen',
        text: 'Je verstuurt de offerte vanuit je eigen Gmail of Outlook. Je klant krijgt een nette mail met een knop naar zijn offerte. Daar bekijkt hij hem en tekent hij met zijn vinger of muis; de handtekening komt op de offerte en de offerte staat op Goedgekeurd.',
        steps: [
          'Koppel eenmalig je mailbox bij Instellingen > Plug-ins.',
          'Kies op de offerte "Versturen" en bevestig.',
          'Je ziet wanneer en hoe vaak de klant de offerte opende. Tekent hij niet, dan gaat er na het aantal dagen dat jij kiest één vriendelijke herinnering.',
        ],
      },
      {
        title: 'Van offerte naar factuur',
        text: 'Is de offerte goedgekeurd, dan zet je hem met "Omzetten naar factuur" om naar een conceptfactuur met alle regels en btw-tarieven erin. Factureer je in delen, zet de offerte dan bij een project en leg daar de termijnen vast.',
      },
      {
        title: 'Nummering',
        text: 'Bij Instellingen > Offertes stel je het volgende offertenummer in, bijvoorbeeld 20260050 of OFF-118. Synbased telt de cijfers achteraan zelf verder. Verwijder je de laatst gemaakte offerte, dan krijgt de volgende hetzelfde nummer weer.',
      },
    ],
    faq: [
      { q: 'Kan ik een offerte goedkeuren zonder handtekening?', a: 'Ja. Gaat de klant per mail of telefoon akkoord, dan zet je de offerte zelf op Goedgekeurd.' },
      { q: 'Kan ik een offerte kopiëren?', a: 'Ja, in de lijst met offertes kies je bij een offerte "Kopiëren"; je krijgt een nieuw concept met dezelfde regels.' },
      { q: 'Kan ik meerdere btw-tarieven op één offerte zetten?', a: 'Ja. Zet ze in aparte prijstabellen; elke tabel heeft zijn eigen tarief en subtotaal, en onderaan staat de totale prijs.' },
    ],
  },
  invoices: {
    topics: [
      {
        title: 'Een factuur maken en versturen',
        text: 'Een nieuwe factuur is eerst een concept zonder nummer. Je kunt hem nog helemaal aanpassen of weggooien. Pas als je hem vastlegt, krijgt hij zijn nummer en ligt hij vast.',
        steps: [
          'Maak een factuur bij Facturen, vanuit een goedgekeurde offerte, of als termijn vanuit een project.',
          'Kies "Versturen": de klant krijgt een mail met de betaalgegevens, een QR-code voor zijn bank-app en een knop naar de factuur.',
          'Verstuur je hem zelf als PDF? Kies dan eerst "Markeren als verzonden" en download hem daarna, zodat het nummer erop staat.',
        ],
      },
      {
        title: 'Volgens de regels van de Belastingdienst',
        text: 'Factuurnummers lopen altijd door, zonder gaten: een nummer wordt pas uitgegeven als de factuur vastligt. Een verstuurde factuur kun je niet meer wijzigen of verwijderen. Zit er een fout in, dan maak je met "Creditfactuur maken" een creditfactuur die de factuur (of een deel ervan) terugdraait, met een eigen nummer uit dezelfde reeks.',
      },
      {
        title: 'Btw verlegd en buitenland',
        text: 'Per prijstabel kies je de btw: 21%, 9% of 0%, of Btw verlegd (bijvoorbeeld bij onderaanneming), Intracommunautair (een bedrijf in een ander EU-land) of Export buiten de EU. Dan staat er geen btw op de factuur, maar de verplichte vermelding, bij verlegd en EU met het btw-nummer van de klant.',
      },
      {
        title: 'Betaald krijgen',
        text: 'Je klant scant de QR-code met zijn bank-app, of betaalt met iDEAL als Mollie aan staat. Met Bank of de bankkoppeling staat een factuur vanzelf op betaald zodra het geld binnen is. Is hij te laat, dan gaat er na het aantal dagen dat jij kiest een betalingsherinnering, en daarna nog één.',
      },
    ],
    faq: [
      { q: 'Welke betalingstermijn krijgt een factuur?', a: 'Die stel je in bij Instellingen > Facturen, standaard 30 dagen. Per factuur pas je de vervaldatum nog aan.' },
      { q: 'Kan ik een verstuurde factuur nog aanpassen?', a: 'Nee, dat mag niet volgens de Belastingdienst. Maak een creditfactuur en daarna zo nodig een nieuwe factuur.' },
      { q: 'Kan ik mijn eigen factuurnummers gebruiken?', a: 'Ja. Stel bij Instellingen > Facturen het volgende nummer in; Synbased telt de cijfers achteraan verder, met een jaartal of letters ervoor als je wilt.' },
      { q: 'Wat ziet mijn klant?', a: 'Een mail met je logo en eigen tekst, en een pagina waar hij de factuur bekijkt, downloadt en betaalt. Hij hoeft niet in te loggen.' },
    ],
  },
  customers: {
    topics: [
      {
        title: 'Klanten vastleggen',
        text: 'Een klant kan een particulier of een bedrijf zijn. Je legt de contactgegevens, het adres, en bij een bedrijf het KvK- en btw-nummer vast. Elke klant kan een eigen klantnummer krijgen, dat ook in de keuzelijsten staat.',
        steps: [
          'Kies bij Klanten "Klant toevoegen", of laat de AI een klant maken uit een mail of WhatsApp-bericht.',
          'Vul minstens de naam en het e-mailadres in: dat adres is nodig om offertes en facturen te versturen.',
        ],
      },
      {
        title: 'Alles bij de klant',
        text: 'Bij een klant zie je onder de tabbladen zijn offertes en notities. Zo weet je bij een telefoontje meteen wat er speelt.',
      },
      {
        title: 'Btw-nummer en IBAN',
        text: 'Het btw-nummer is nodig bij btw verlegd en leveringen binnen de EU: het moet dan op de factuur staan. Met het IBAN van de klant herkent Bank zijn betalingen vaker vanzelf.',
      },
    ],
    faq: [
      { q: 'Kan ik klanten importeren?', a: 'Neem contact met ons op bij de demo; we zetten je bestaande klanten voor je over.' },
      { q: 'Wat gebeurt er als ik een klant verwijder?', a: 'Een klant met offertes of facturen kun je niet zomaar verwijderen; die documenten moeten bewaard blijven.' },
    ],
  },
  projects: {
    topics: [
      {
        title: 'Een project aanmaken',
        text: 'Een project is een klus, zoals "Badkamer Familie Verhoef". Je kiest de klant, de fase (Offerte, Gepland, In uitvoering, Opgeleverd), het adres van de klus en de planning.',
        steps: [
          'Kies bij Projecten "Project toevoegen" en vul de naam en de klant in.',
          'Maak vanuit het project een offerte, factuur, kostenpost of notitie: het project staat dan al ingevuld.',
          'Bestond het al? Kies bij het project "Koppelen". Ook een verstuurde factuur kun je koppelen.',
        ],
      },
      {
        title: 'Factureren in termijnen',
        text: 'Bij grotere klussen factureer je in delen. Je legt dat één keer vast en factureert daarna elke termijn met één klik.',
        steps: [
          'Maak eerst een offerte bij het project.',
          'Kies in het blok Termijnen "Termijnen vastleggen". Er staat een voorstel klaar: 30% bij opdracht, 50% halverwege en 20% bij oplevering. Pas het aan zoals je wilt; samen moet het 100% zijn.',
          'Is de offerte goedgekeurd, dan staat bij elke termijn de knop "Factureren". Je krijgt een conceptfactuur voor dat deel, met de juiste btw, om na te kijken en te versturen.',
          'Per termijn zie je of hij nog gefactureerd moet worden, verstuurd is of betaald is.',
        ],
      },
      {
        title: 'Je marge per project',
        text: 'Het overzicht toont wat er geoffreerd is (goedgekeurde offertes), wat er gefactureerd is (verstuurde facturen) en de kosten (bonnen en inkoopfacturen bij het project), allemaal exclusief btw. Wat overblijft is je marge. Zo zie je per klus wat hij oplevert, en kun je scherper offreren.',
      },
    ],
    faq: [
      { q: 'Moet er al een factuur zijn voor ik termijnen kan maken?', a: 'Nee. Je hebt een offerte bij het project nodig. Zodra die goedgekeurd is, maak je de eerste termijnfactuur vanuit het schema.' },
      { q: 'Kan ik een termijn nog wijzigen?', a: 'Zolang hij nog niet gefactureerd is wel. Een termijn met een factuur ligt vast; gooi je het concept weg, dan komt hij weer vrij.' },
      { q: 'Kan ik meer dan de offerte factureren?', a: 'Niet via termijnen: samen zijn ze altijd 100% van de offerte. Meerwerk factureer je met een losse factuur bij het project.' },
      { q: 'Wat gebeurt er als ik een project verwijder?', a: 'De offertes, facturen, kosten en notities blijven gewoon bestaan, alleen zonder project.' },
    ],
  },
  products: {
    topics: [
      {
        title: 'Je vaste prijzen',
        text: 'Bij Producten zet je werk en materiaal dat je vaak gebruikt, met prijs exclusief btw en eenheid: per stuk, uur, dag, meter, m², m³, kilo, ton of post.',
      },
      {
        title: 'Kiezen terwijl je typt',
        text: 'Typ je in een prijstabel een omschrijving, dan verschijnen je producten als suggestie. Kies er een en de prijs en eenheid staan er meteen; je vult alleen nog het aantal in.',
      },
      {
        title: 'Prijzen aanpassen',
        text: 'Een regel krijgt een kopie van het product. Pas je later de prijs aan, dan geldt die vanaf de volgende offerte; oude offertes en facturen blijven zoals ze waren.',
      },
    ],
    faq: [
      { q: 'Moet ik elke regel als product vastleggen?', a: 'Nee. Vrij uitgeschreven regels blijven gewoon kunnen; producten zijn er om tijd te besparen.' },
      { q: 'Gebruikt de AI mijn prijzen?', a: 'Ja. Bij een offerte uit een mail of WhatsApp-bericht kijkt de AI naar de prijzen in je eerdere offertes.' },
    ],
  },
  expenses: {
    topics: [
      {
        title: 'Een bonnetje of inkoopfactuur toevoegen',
        text: 'Elke uitgave voor je bedrijf zet je bij Kosten, met het bestand erbij. Dat bestand blijft afgeschermd bewaard, zodat je aan de bewaarplicht van zeven jaar voldoet.',
        steps: [
          'Kies "Kosten toevoegen" en upload een foto of PDF.',
          'Met een AI-plug-in leest Synbased de bon: leverancier, datum, bedragen per btw-tarief en een categorie. Controleer en sla op.',
          'Zonder AI vul je het zelf in; de btw rekent zichzelf uit en kun je aanpassen.',
        ],
      },
      {
        title: 'Categorieën en btw',
        text: 'De categorie bepaalt waar de kosten in je jaarcijfers komen, zoals inkoop materiaal, gereedschap of auto en vervoer. De btw telt als voorbelasting in je btw-aangifte, behalve bij eten, drinken en relatiegeschenken: die btw krijg je niet terug.',
      },
      {
        title: 'Verlegde btw en buitenland',
        text: 'Factureert een onderaannemer je met btw verlegd, of koop je in uit het buitenland zonder Nederlandse btw? Kies dan bij Tarief "Btw naar mij verlegd", "Inkoop uit de EU" of "Inkoop van buiten de EU". Je betaalt de leverancier geen btw, maar geeft hem zelf aan en trekt hem in dezelfde aangifte weer af.',
      },
    ],
    faq: [
      { q: 'Kan ik kosten aan een klus koppelen?', a: 'Ja, kies bij de kostenpost een project. Dan telt hij mee in de marge van dat project.' },
      { q: 'Hoe staat een bon op betaald?', a: 'Een kassabon zet je meteen op betaald. Een inkoopfactuur gaat vanzelf op betaald als Bank de betaling herkent, of je zet hem zelf op betaald.' },
      { q: 'Mag ik een bon verwijderen?', a: 'Dat kan, maar doe het alleen bij iets wat er per ongeluk in staat: bonnen moet je zeven jaar bewaren.' },
    ],
  },
  bank: {
    topics: [
      {
        title: 'Transacties binnenhalen',
        text: 'Je kunt een afschrift importeren, of je bank koppelen zodat de transacties elke ochtend vanzelf binnenkomen.',
        steps: [
          'Download in je bank-app of internetbankieren een afschrift als CAMT.053 (XML) of MT940. Bij ING, Rabobank, ABN AMRO, bunq en Knab staat dat bij Downloaden of Exporteren.',
          'Kies bij Bank "Afschrift importeren" en kies het bestand. Een afschrift dat al eerder is ingelezen kan geen kwaad: dubbele transacties worden overgeslagen.',
          'Of zet de Bankkoppeling aan bij Instellingen > Plug-ins.',
        ],
      },
      {
        title: 'Vanzelf koppelen',
        text: 'Synbased koppelt een transactie alleen als het zeker is: hetzelfde bedrag én het factuurnummer in de omschrijving, of het IBAN van de klant. De factuur gaat dan op betaald. Bij uitgaven gebeurt hetzelfde met je kostenposten.',
      },
      {
        title: 'Verwerken wat overblijft',
        text: 'Wat niet zeker is, staat op "Te verwerken". Kies "Koppelen" en wijs een factuur of kostenpost aan, of deel de transactie in: privé, Belastingdienst, overboeking of uitbetaling (zoals Mollie), bankkosten, of overige inkomsten en kosten. Zo kloppen je jaarcijfers.',
      },
    ],
    faq: [
      { q: 'Kan Synbased geld van mijn rekening halen?', a: 'Nee. Synbased kan alleen transacties lezen, nooit geld overmaken.' },
      { q: 'Waarom staat mijn saldo op een streepje?', a: 'Het saldo komt uit het beginsaldo van je eerste afschrift. Importeer een afschrift waar het beginsaldo in staat, of gebruik de bankkoppeling.' },
      { q: 'Ik koppelde de verkeerde factuur, wat nu?', a: 'Kies bij de transactie "Wijzigen" en ontkoppel of kies de goede. Wat de koppeling op betaald had gezet, gaat terug naar open.' },
    ],
  },
  vat: {
    topics: [
      {
        title: 'Je aangifte, rubriek voor rubriek',
        text: 'Het Btw-overzicht rekent je aangifte uit zoals in Mijn Belastingdienst Zakelijk: 1a en 1b (hoog en laag tarief), 1e (0% en btw verlegd naar je klant), en waar van toepassing 2a, 3a, 3b, 4a en 4b. Daaronder 5a (verschuldigde btw), 5b (voorbelasting) en wat je betaalt of terugkrijgt.',
        steps: [
          'Kies het kwartaal; standaard staat het vorige open, want daar doe je nu aangifte over.',
          'Kijk de facturen en kosten eronder na.',
          'Neem de bedragen over in Mijn Belastingdienst Zakelijk; de Belastingdienst rondt af op hele euro’s.',
        ],
      },
      {
        title: 'Wat er meetelt',
        text: 'Omzet telt op factuurdatum: verstuurde en betaalde facturen, creditfacturen als min-bedrag, geen concepten. Kosten tellen op de datum van de bon. Inkoop met verlegde btw geef je aan in 2a, 4a of 4b en trek je weer af in 5b.',
      },
      {
        title: 'ICP-opgaaf en export',
        text: 'Lever je aan bedrijven in andere EU-landen, dan staat er een ICP-opgaaf onder: per klant het btw-nummer en het bedrag. Met "Exporteren" krijg je alle facturen en kosten van de periode als CSV voor je boekhouder.',
      },
    ],
    faq: [
      { q: 'Kan Synbased de aangifte voor mij indienen?', a: 'Nee, je neemt de bedragen zelf over in Mijn Belastingdienst Zakelijk. Dat duurt een paar minuten.' },
      { q: 'Kan ik per maand aangifte doen?', a: 'Het overzicht werkt nu per kwartaal of per jaar, omdat de meeste ondernemers per kwartaal aangifte doen. Per maand zit er nog niet in.' },
      { q: 'Klopt het altijd?', a: 'Het overzicht komt uit je facturen en kosten. Twijfel je over een buitenlandse levering of een bijzondere regeling, laat het dan nakijken door je boekhouder.' },
    ],
  },
  reports: {
    topics: [
      {
        title: 'Boekhouden zonder te boeken',
        text: 'Synbased houdt onder water een complete boekhouding bij, met dubbel boekhouden, afgeleid uit je facturen, kosten en banktransacties. Je hoeft zelf niets te boeken, en het loopt nooit uit de pas.',
      },
      {
        title: 'Winst-en-verlies en balans',
        text: 'Per jaar zie je je omzet per tarief en je kosten per categorie, met je winst of verlies. De balans op 31 december toont bank, debiteuren (nog te ontvangen), crediteuren (nog te betalen), btw en je eigen vermogen.',
      },
      {
        title: 'Zo kloppen je cijfers',
        text: 'Verwerk eerst alles bij Bank: een transactie op "Te verwerken" staat apart op de balans. Zet betaalde facturen en kosten op betaald. Met "Grootboek exporteren" krijgt je boekhouder elke boeking van het jaar.',
      },
    ],
    faq: [
      { q: 'Is dit mijn officiële jaarrekening?', a: 'Nee. Afschrijvingen op investeringen, voorraad en fiscale regelingen zoals de zelfstandigenaftrek zitten er niet in. Je boekhouder maakt daar de jaarrekening en aangifte inkomstenbelasting van.' },
      { q: 'Heb ik nog een boekhoudpakket nodig?', a: 'Voor je dagelijkse administratie niet. Voor de jaarafsluiting werkt je boekhouder met de export.' },
    ],
  },
  dashboard: {
    topics: [
      {
        title: 'Wat je ziet',
        text: 'Bovenaan wat er nog binnen moet komen, wat over de vervaldatum is, de openstaande offertes en hoeveel procent er wordt goedgekeurd. Daaronder je omzet per periode: gerealiseerd (betaald, op de betaaldatum) en ongerealiseerd (verstuurd, nog niet betaald).',
      },
      {
        title: 'Snel aan de slag',
        text: 'Met de knoppen bovenaan maak je direct een offerte of factuur, en een klik op een regel in de lijsten opent die offerte of factuur.',
      },
    ],
    faq: [
      { q: 'Waarom staat een betaalde factuur niet in de omzet?', a: 'Omzet telt op de betaaldatum. Kijk of de periode rechtsboven in de grafiek klopt.' },
    ],
  },
  notes: {
    topics: [
      {
        title: 'Opschrijven wat telt',
        text: 'Maten, afspraken en wensen schrijf je op in een notitie, met koppen, lijstjes en vet. Een notitie hoort bij een klant en eventueel bij een project.',
      },
      {
        title: 'Terugvinden',
        text: 'Je vindt notities bij Notities, bij de klant onder het tabblad Notities, en bij het project. Zoeken werkt op titel, tekst en klantnaam.',
      },
    ],
    faq: [
      { q: 'Kan ik een notitie op mijn telefoon maken?', a: 'Ja, Synbased werkt in de browser op je telefoon.' },
    ],
  },
  google: {
    topics: [
      {
        title: 'Koppelen',
        text: 'Je koppelt je Google-account bij Instellingen > Plug-ins. Je logt in bij Google zelf; Synbased krijgt alleen toegang tot je mail en agenda.',
      },
      {
        title: 'Mail en agenda in Synbased',
        text: 'Je leest, beantwoordt en archiveert je mail in de Inbox, en plant afspraken in de Agenda. Offertes, facturen en herinneringen gaan vanaf je eigen adres en staan in je Verzonden. Met een AI-plug-in zet je een aanvraag in je inbox met één klik om naar een offerte.',
      },
    ],
    faq: [
      { q: 'Wordt mijn mail bij Synbased bewaard?', a: 'Nee. Je mail wordt elke keer bij Google opgehaald; alleen de toegang staat versleuteld bij ons.' },
      { q: 'Kan ik weer ontkoppelen?', a: 'Ja, zet de schakelaar bij Plug-ins uit. Je mail en afspraken blijven gewoon in Google staan.' },
    ],
  },
  microsoft: {
    topics: [
      {
        title: 'Koppelen',
        text: 'Je koppelt je Microsoft-account bij Instellingen > Plug-ins, voor Microsoft 365 en Outlook.com. Bij een zakelijk account moet je IT-beheerder soms eerst toestemming geven; daarvoor staat er een link klaar die hij één keer opent.',
      },
      {
        title: 'Mail en agenda in Synbased',
        text: 'Inbox en Agenda werken zoals bij Gmail: lezen, beantwoorden, plannen, en offertes en facturen vanaf je eigen Outlook-adres.',
      },
    ],
    faq: [
      { q: 'Werkt het met mijn werk-account?', a: 'Ja, met Microsoft 365. Vraagt Microsoft om goedkeuring van een beheerder, stuur dan de link uit de plug-in naar je IT-beheerder.' },
    ],
  },
  whatsapp: {
    topics: [
      {
        title: 'Je nummer koppelen',
        text: 'Bij Instellingen > Plug-ins koppel je je eigen mobiele nummer aan de bot van Synbased. Daarna worden berichten vanaf dat nummer aan de bot conceptoffertes.',
      },
      {
        title: 'Een offerte vanaf de bouwplaats',
        text: 'Stuur in steekwoorden wat je ziet en meet, met de naam en het adres van de klant, zoals "Verhoef, Voorbeeldlaan 12. Keuken 45m2 tegels eruit, vloerverwarming". De bot herkent de klant of maakt hem aan, en de AI zet de regels erin met de prijzen uit je eerdere offertes.',
        steps: [
          'Stuur het bericht aan de bot.',
          'Je krijgt antwoord met het offertenummer en het bedrag.',
          'Kijk de offerte na in Synbased en verstuur hem.',
        ],
      },
    ],
    faq: [
      { q: 'Wordt de offerte meteen naar de klant gestuurd?', a: 'Nee, het is altijd een concept. Jij kijkt hem na en verstuurt hem.' },
      { q: 'Heb ik een AI-plug-in nodig?', a: 'Ja, de bot gebruikt de AI die je bij Plug-ins hebt gekoppeld om je bericht te lezen.' },
    ],
  },
  ai: {
    topics: [
      {
        title: 'Je eigen AI kiezen',
        text: 'Je koppelt een eigen API-sleutel van Anthropic (Claude), OpenAI of Google Gemini bij Instellingen > Plug-ins. Je betaalt het gebruik zelf bij die dienst; Gemini heeft een gratis laag om te proberen.',
      },
      {
        title: 'Van mail naar offerte',
        text: 'Bij een aanvraag in je Inbox kies je "Omzetten naar offerte". De AI leest het gesprek en stelt de klant, de regels en prijzen uit je eerdere offertes voor. Ontbreekt er iets, zoals het adres of de maten, dan schrijft hij een antwoord aan de klant dat erom vraagt.',
      },
      {
        title: 'Bonnetjes lezen',
        text: 'Bij een nieuwe kostenpost leest de AI de foto of PDF: leverancier, datum, bedragen per btw-tarief, de categorie, en of de btw verlegd is.',
      },
    ],
    faq: [
      { q: 'Verzint de AI prijzen?', a: 'Nee. Hij gebruikt alleen prijzen uit je eerdere offertes en laat een prijs leeg als er niets vergelijkbaars is.' },
      { q: 'Gebeurt er iets zonder mijn controle?', a: 'Nee, het is altijd een voorstel dat jij nakijkt en opslaat.' },
    ],
  },
  mollie: {
    topics: [
      {
        title: 'Installeren',
        text: 'Maak een account aan op mollie.com met je KvK-nummer en rekening. Kopieer daarna in je Mollie-dashboard de live-sleutel en plak hem bij Instellingen > Plug-ins > Mollie. Met een testsleutel probeer je het eerst zonder echt te betalen.',
      },
      {
        title: 'Je klant betaalt direct',
        text: 'Op de factuurpagina van je klant komt een betaalknop met iDEAL, Bancontact en meer. Is er betaald, dan staat de factuur vanzelf op betaald met de juiste datum. Het geld gaat rechtstreeks naar je eigen rekening; Mollie maakt het in delen naar je over.',
      },
    ],
    faq: [
      { q: 'Wat kost het?', a: 'Je betaalt per betaling aan Mollie; voor iDEAL is dat rond € 0,30.' },
      { q: 'Hoe verwerk ik de uitbetaling van Mollie bij Bank?', a: 'De facturen staan al op betaald. Deel de uitbetaling op je bank in als "Overboeking of uitbetaling".' },
    ],
  },
  'bank-connection': {
    topics: [
      {
        title: 'Koppelen',
        text: 'Bij Instellingen > Plug-ins > Bankkoppeling kies je je bank. Je gaat naar je eigen bank om in te loggen en toestemming te geven; die geldt 90 dagen, daarna vraagt je bank het opnieuw.',
      },
      {
        title: 'Elke ochtend bijgewerkt',
        text: 'Synbased haalt elke ochtend je nieuwe transacties op en koppelt ze waar het zeker is aan facturen en kosten. Met "Nu ophalen" bij Bank doe je het meteen.',
      },
    ],
    faq: [
      { q: 'Is het veilig?', a: 'Synbased kan alleen lezen. De koppeling loopt via GoCardless, dat een PSD2-vergunning heeft, en jij geeft bij je eigen bank toestemming.' },
      { q: 'Kan ik ook nog afschriften importeren?', a: 'Ja, maar gebruik voor één rekening het een of het ander, anders kunnen transacties dubbel binnenkomen.' },
    ],
  },
};
