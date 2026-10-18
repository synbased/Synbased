import { projectIdFromBody } from '@/lib/projects';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getNotes, createNote } from '@/lib/db';
import { isRichTextEmpty, sanitizeRichText } from '@/lib/richtext';
import { errorStatus } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tenantId = (session.user as any).tenantId;

  try {
    if (req.method === 'GET') {
      const { customer_id } = req.query;
      const customerId = customer_id ? parseInt(customer_id as string) : undefined;

      const notes = await getNotes(tenantId, customerId);
      return res.status(200).json(notes);
    }

    if (req.method === 'POST') {
      const { customer_id, title, project_id } = req.body;
      // De notitie komt als HTML uit de teksteditor; alleen de toegestane opmaak blijft
      const content = sanitizeRichText(String(req.body.content || ''));

      if (!customer_id || !String(title || '').trim() || isRichTextEmpty(content)) {
        return res.status(400).json({ error: 'Customer ID, title, and content are required' });
      }

      const note = await createNote({
        tenant_id: tenantId,
        customer_id: parseInt(customer_id),
        title,
        content,
        project_id: projectIdFromBody(project_id) ?? null,
      });

      return res.status(201).json(note);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(errorStatus(error)).json({ error: error.message || 'Internal server error' });
  }
}
