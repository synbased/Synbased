import { PROJECT_STATUS } from './constants';

/**
 * De regels rond een project, voor het scherm en de API allebei. Zie
 * getProjectOverview in db.ts voor de cijfers per project.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** De velden uit een verzoek, gecontroleerd; de melding is voor de gebruiker */
export function projectFromBody(body: any): { fields: Record<string, any>; problem?: string } {
  const name = String(body?.name || '').trim();
  if (!name) return { fields: {}, problem: 'Geef het project een naam' };

  return {
    fields: {
      name,
      customer_id: body.customer_id ? Number(body.customer_id) : null,
      status: body.status in PROJECT_STATUS ? body.status : 'planned',
      address: String(body.address || '').trim() || null,
      start_date: DATE.test(String(body.start_date || '')) ? body.start_date : null,
      end_date: DATE.test(String(body.end_date || '')) ? body.end_date : null,
      description: String(body.description || '').trim() || null,
    },
  };
}

/** Een project-id uit een verzoek: een getal, of null om het los te koppelen */
export function projectIdFromBody(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : null;
}
