import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { saveInstallments } from '@/lib/db';

/**
 * Het termijnschema van een project vastleggen: PUT { quoteId, rows: [{ id?,
 * label, percentage }] }. Samen 100%; zie saveInstallments.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = (session.user as any).tenantId;
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  try {
    await saveInstallments(id, tenantId, Number(req.body?.quoteId), Array.isArray(req.body?.rows) ? req.body.rows : []);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Installments error:', error);
    return res.status(400).json({ error: error.message || 'De termijnen konden niet worden opgeslagen' });
  }
}
