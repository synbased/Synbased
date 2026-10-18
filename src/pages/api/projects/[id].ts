import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { deleteProject, getProjectOverview, updateProject } from '@/lib/db';
import { projectFromBody } from '@/lib/projects';
import { errorStatus } from '@/lib/utils';

/** Eén project: GET met alles wat erbij hoort en de cijfers, PUT, DELETE */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = (session.user as any).tenantId;
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await getProjectOverview(id, tenantId));
    }

    if (req.method === 'PUT') {
      const { fields, problem } = projectFromBody(req.body);
      if (problem) return res.status(400).json({ error: problem });
      return res.status(200).json(await updateProject(id, tenantId, fields));
    }

    if (req.method === 'DELETE') {
      await deleteProject(id, tenantId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(errorStatus(error)).json({ error: error.message || 'Internal server error' });
  }
}
