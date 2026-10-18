import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { invoiceInstallment } from '@/lib/db';

/** Eén termijn factureren: POST. Komt terug als conceptfactuur om na te kijken. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = (session.user as any).tenantId;
  const { id, installmentId } = req.query;
  if (typeof id !== 'string' || typeof installmentId !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  try {
    return res.status(201).json(await invoiceInstallment(id, tenantId, installmentId));
  } catch (error: any) {
    console.error('Installment invoice error:', error);
    return res.status(400).json({ error: error.message || 'De termijnfactuur kon niet gemaakt worden' });
  }
}
