import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { createInstallmentInvoice } from '@/lib/db';

/**
 * Een termijnfactuur maken: POST { quoteId, percentage, label }. Komt terug als
 * concept, zodat je hem nog kunt nakijken voor je hem verstuurt.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = (session.user as any).tenantId;
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  try {
    const invoice = await createInstallmentInvoice(id, tenantId, {
      quoteId: Number(req.body?.quoteId),
      percentage: Number(req.body?.percentage),
      label: String(req.body?.label || '').trim(),
    });
    return res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Installment error:', error);
    return res.status(400).json({ error: error.message || 'De termijnfactuur kon niet gemaakt worden' });
  }
}
