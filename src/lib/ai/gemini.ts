import { ApiError, GoogleGenAI, ThinkingLevel, type ThinkingConfig } from '@google/genai';
import { z } from 'zod';
import { RECEIPT_PROMPT, buildUserPrompt, systemPrompt } from './prompt';
import { AiKeyError, QuoteProposalSchema, ReceiptReadingSchema, type AiProvider } from './types';

/**
 * Google Gemini, met de sleutel van de gebruiker zelf. Via Google AI Studio is
 * er een gratis laag, dus hiermee is de functie zonder kosten uit te proberen.
 *
 * gemini-flash-latest wijst altijd naar het huidige Flash-model; met
 * GEMINI_MODEL kies je zelf een vast model.
 */
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

/** Een vast, rustiger model om op terug te vallen als het nieuwste Flash-model overbelast is */
const FALLBACK_MODEL = 'gemini-2.5-flash';

/**
 * Voor bonnen: Flash-Lite is gemaakt voor snel overtikwerk zoals dit, en veel
 * minder druk dan het nieuwste Flash-model. Met GEMINI_RECEIPT_MODEL kies je
 * zelf een ander model.
 */
const RECEIPT_MODEL = process.env.GEMINI_RECEIPT_MODEL || 'gemini-2.5-flash-lite';

/** Zo lang wachten voor een volgende poging, in milliseconden */
const RETRY_DELAYS = [800, 2000];

/**
 * Zo lang mag één vraag duren, en na zoveel tijd in totaal geen nieuwe poging
 * meer. Samen ruim binnen de 60 seconden die de route krijgt.
 */
const REQUEST_TIMEOUT = 45_000;
const RETRY_BUDGET = 12_000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Een fout aan de kant van Google die meestal vanzelf overgaat: overbelast of even onbereikbaar */
const isTemporary = (error: unknown) => error instanceof ApiError && [500, 502, 503, 504].includes(error.status);

/**
 * Een vraag aan Gemini, met een paar pogingen als Google even overbelast is
 * (503). Blijft het nieuwste Flash-model overbelast, dan nog één keer met een
 * vast model. Wie zelf GEMINI_MODEL instelt, blijft bij dat model.
 */
async function withRetries<T>(
  ask: (model: string) => Promise<T>,
  model = MODEL,
  fallback: string | null = process.env.GEMINI_MODEL ? null : FALLBACK_MODEL
): Promise<T> {
  // Alles samen blijft ruim binnen de tijd die de server een aanvraag geeft;
  // anders krijgt de gebruiker een foutpagina in plaats van een melding
  const started = Date.now();
  const timeLeft = (needed: number) => Date.now() - started + needed < RETRY_BUDGET;

  for (let attempt = 0; ; attempt++) {
    try {
      return await ask(model);
    } catch (error) {
      if (!isTemporary(error)) throw error;
      if (attempt < RETRY_DELAYS.length && timeLeft(RETRY_DELAYS[attempt])) {
        await wait(RETRY_DELAYS[attempt]);
        continue;
      }
      if (!fallback || fallback === model || !timeLeft(0)) throw error;
      return ask(fallback);
    }
  }
}

// Het antwoordformaat als JSON-schema, eenmalig uit hetzelfde zod-schema.
// Gemini kent maar een deel van JSON Schema; de verwijzing naar de
// schemaversie hoort daar niet bij
const { $schema: _version, ...RESPONSE_SCHEMA } = z.toJSONSchema(QuoteProposalSchema);
const { $schema: _receiptVersion, ...RECEIPT_SCHEMA } = z.toJSONSchema(ReceiptReadingSchema);

function client(apiKey: string) {
  return new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT } });
}

/** Een fout van Google als een melding die de gebruiker begrijpt. */
function explain(error: unknown): Error {
  if (error instanceof ApiError) {
    if (error.status === 400 && /api key/i.test(error.message)) {
      return new AiKeyError('Deze API-sleutel van Google werkt niet. Vul bij Plug-ins een geldige sleutel in.');
    }
    if (error.status === 401 || error.status === 403) {
      return new AiKeyError('Deze API-sleutel van Google werkt niet (meer). Vul bij Plug-ins een geldige sleutel in.');
    }
    if (error.status === 429) {
      return new Error('De gratis limiet van Gemini is even bereikt. Probeer het over een minuut opnieuw.');
    }
    if (isTemporary(error)) {
      return new Error('Gemini is even overbelast. Probeer het over een minuut opnieuw.');
    }
    return new Error(`Gemini gaf een fout (${error.status}). Probeer het opnieuw.`);
  }
  // De vraag duurde langer dan REQUEST_TIMEOUT
  if (error instanceof Error && (/abort|timeout|timed out/i.test(error.name) || /abort|timeout|timed out/i.test(error.message))) {
    return new Error('Gemini reageerde niet op tijd. Probeer het opnieuw.');
  }
  return error instanceof Error ? error : new Error('De AI is niet bereikbaar');
}

export const gemini: AiProvider = {
  async verifyKey(apiKey) {
    try {
      // Kost niets en zegt meteen of de sleutel bij dit model mag
      await client(apiKey).models.get({ model: MODEL });
    } catch (error) {
      throw explain(error);
    }
  },

  async proposeQuote(apiKey, input) {
    try {
      const response = await withRetries((model) => client(apiKey).models.generateContent({
        model,
        contents: buildUserPrompt(input),
        config: {
          systemInstruction: systemPrompt(input.source),
          responseMimeType: 'application/json',
          responseJsonSchema: RESPONSE_SCHEMA,
        },
      }));

      const parsed = QuoteProposalSchema.safeParse(JSON.parse(response.text || 'null'));
      if (!parsed.success) throw new Error('De AI kwam niet tot een volledig voorstel. Probeer het opnieuw.');
      return parsed.data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('De AI kwam niet tot een volledig voorstel. Probeer het opnieuw.');
      }
      throw explain(error);
    }
  },

  async readReceipt(apiKey, file) {
    const read = (model: string, thinkingConfig: ThinkingConfig) =>
      client(apiKey).models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: file.mediaType, data: file.base64 } },
              { text: 'Lees dit bonnetje of deze factuur uit.' },
            ],
          },
        ],
        config: {
          systemInstruction: RECEIPT_PROMPT,
          responseMimeType: 'application/json',
          responseJsonSchema: RECEIPT_SCHEMA,
          thinkingConfig,
        },
      });

    // Een bon overnemen is geen denkwerk. Gemini 2.5 zet nadenken uit met een
    // budget van 0, nieuwere modellen met het laagste denkniveau; meteen de
    // goede, zodat er geen tweede vraag nodig is. Kent het model hem toch
    // niet, dan alsnog de andere
    let usedModel = RECEIPT_MODEL;
    const readWithoutThinking = async (model: string) => {
      usedModel = model;
      const first: ThinkingConfig = /2\.5/.test(model) ? { thinkingBudget: 0 } : { thinkingLevel: ThinkingLevel.MINIMAL };
      try {
        return await read(model, first);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 400 || !/think/i.test(error.message)) throw error;
        return read(model, 'thinkingBudget' in first ? { thinkingLevel: ThinkingLevel.MINIMAL } : { thinkingBudget: 0 });
      }
    };

    // In de logs van Vercel: welk model en hoe lang, zodat traagheid te vinden is
    const started = Date.now();
    try {
      const response = await withRetries(readWithoutThinking, RECEIPT_MODEL, process.env.GEMINI_RECEIPT_MODEL ? null : FALLBACK_MODEL);
      console.log(`[gemini] bon gelezen met ${usedModel} in ${Date.now() - started} ms`);

      const parsed = ReceiptReadingSchema.safeParse(JSON.parse(response.text || 'null'));
      if (!parsed.success) throw new Error('De AI kon dit bestand niet lezen. Vul de gegevens met de hand in.');
      return parsed.data;
    } catch (error) {
      console.error(
        `[gemini] bon lezen mislukt met ${usedModel} na ${Date.now() - started} ms:`,
        error instanceof ApiError ? `${error.status} ${error.message}` : error
      );
      if (error instanceof SyntaxError) {
        throw new Error('De AI kon dit bestand niet lezen. Vul de gegevens met de hand in.');
      }
      throw explain(error);
    }
  },
};
