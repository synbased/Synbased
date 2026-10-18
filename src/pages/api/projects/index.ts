import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createProject, getProjects } from '@/lib/db';
import { projectFromBody } from '@/lib/projects';
import { errorStatus } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = (session.user as any).tenantId;

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await getProjects(tenantId));
    }

    if (req.method === 'POST') {
      const { fields, problem } = projectFromBody(req.body);
      if (problem) return res.status(400).json({ error: problem });
      return res.status(201).json(await createProject(tenantId, fields as any));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(errorStatus(error)).json({ error: error.message || 'Internal server error' });
  }
}
