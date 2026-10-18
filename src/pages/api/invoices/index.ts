import { projectIdFromBody } from '@/lib/projects';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getInvoices, createInvoice } from '@/lib/db';
import { calculateDocumentTotal, errorStatus } from '@/lib/utils';
import { validateBlocks } from '@/lib/blocks';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tenantId = (session.user as any).tenantId;

  try {
    if (req.method === 'GET') {
      const invoices = await getInvoices(tenantId);
      return res.status(200).json(invoices);
    }

    if (req.method === 'POST') {
      const {
        customer_id,
        invoice_date,
        due_date,
        currency,
        intro_text,
        notes,
        blocks,
        project_id,
      } = req.body;

      if (!customer_id) {
        return res.status(400).json({ error: 'Selecteer een klant' });
      }
      // Zonder datum valt een factuur buiten de btw-aangifte en de jaarcijfers
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(invoice_date || ''))) {
        return res.status(400).json({ error: 'Vul de factuurdatum in' });
      }

      const problem = validateBlocks(blocks);
      if (problem) {
        return res.status(400).json({ error: problem });
      }

      const invoice = await createInvoice(
        {
          tenant_id: tenantId,
          customer_id,
          invoice_date,
          due_date,
          currency: currency || 'EUR',
          intro_text: intro_text || null,
          notes: notes || null,
          project_id: projectIdFromBody(project_id) ?? null,
          total: calculateDocumentTotal(blocks),
          // Altijd eerst een concept; vast komt hij pas bij versturen of betaald
          status: 'draft',
        } as any,
        blocks
      );

      return res.status(201).json(invoice);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(errorStatus(error)).json({ error: error.message || 'Internal server error' });
  }
}
