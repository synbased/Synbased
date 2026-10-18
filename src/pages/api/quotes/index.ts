import { projectIdFromBody } from '@/lib/projects';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getQuotes, createQuote, resolveDocumentNumber, checkReferences } from '@/lib/db';
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
      // ?customer_id= geeft alleen de offertes van die klant
      const { customer_id } = req.query;
      const quotes = await getQuotes(tenantId, typeof customer_id === 'string' ? customer_id : undefined);
      return res.status(200).json(quotes);
    }

    if (req.method === 'POST') {
      const {
        customer_id,
        quote_number,
        quote_date,
        valid_until,
        currency,
        intro_text,
        notes,
        blocks,
        project_id,
      } = req.body;

      if (!customer_id || !quote_date || !valid_until) {
        return res.status(400).json({ error: 'Vul datum, geldigheidsdatum en klant in' });
      }

      const problem = validateBlocks(blocks);
      if (problem) {
        return res.status(400).json({ error: problem });
      }

      // Eerst de klant en het project, zodat een geweigerde offerte geen nummer kost
      await checkReferences(tenantId, { customer_id, project_id: projectIdFromBody(project_id) });

      // Het nummer komt uit de eigen nummering, tenzij er zelf iets ingetypt is
      const number = await resolveDocumentNumber(tenantId, 'quote', quote_number);

      if (!number) {
        return res.status(400).json({
          error: 'Vul een offertenummer in, of stel een nummering in bij Instellingen > Account',
        });
      }

      const quote = await createQuote(
        {
          tenant_id: tenantId,
          customer_id,
          quote_number: number,
          quote_date,
          valid_until,
          total: calculateDocumentTotal(blocks),
          status: 'draft',
          currency: currency || 'EUR',
          intro_text: intro_text || null,
          notes: notes || null,
          project_id: projectIdFromBody(project_id) ?? null,
        },
        blocks
      );

      return res.status(201).json(quote);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(errorStatus(error)).json({ error: error.message || 'Internal server error' });
  }
}
