import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { AiKeyError, openAi, type ReceiptReading } from '@/lib/ai';
import { parseDataUrl } from '@/lib/storage';

export const config = {
  api: {
    bodyParser: { sizeLimit: '4.5mb' },
  },
  // Is de AI even overbelast, dan probeert hij het opnieuw; dat mag wat langer duren
  maxDuration: 60,
};

/**
 * Rekent de regels na tegen het totaal op de bon. Een AI haalt soms het
 * subtotaal (al zonder btw) en het totaal door elkaar; kloppen excl. en btw
 * niet met het totaal, en is er één tarief, dan volgt excl. uit het totaal.
 */
function checkAgainstTotal(reading: ReceiptReading): ReceiptReading {
  const total = Number(reading.total_incl) || 0;
  const normal = reading.lines.filter(line => line.vat_type === 'normal');
  if (total <= 0 || normal.length !== 1 || reading.lines.length !== 1) return reading;

  const line = normal[0];
  if (Math.abs(line.amount_excl + line.vat_amount - total) <= 0.02) return reading;
  return { ...reading, lines: [{ ...line, amount_excl: Math.round((total - line.vat_amount) * 100) / 100 }] };
}

/**
 * Een bonnetje of inkoopfactuur laten uitlezen door de AI van de gebruiker:
 * POST { file: { data, name } }. Komt terug als voorstel voor het formulier;
 * er wordt nog niets opgeslagen.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const userId = (session.user as any).id;

  try {
    const { type, buffer } = parseDataUrl(req.body?.file?.data);
    const ai = await openAi(userId);
    const reading = await ai.provider.readReceipt(ai.apiKey, { base64: buffer.toString('base64'), mediaType: type });
    return res.status(200).json(checkAgainstTotal(reading));
  } catch (error: any) {
    if (error instanceof AiKeyError) return res.status(400).json({ error: error.message });
    console.error('Receipt scan error:', error);
    return res.status(400).json({ error: error.message || 'Het bestand kon niet gelezen worden' });
  }
}
