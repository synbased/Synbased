import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { getQuote, getTenant, updateQuote } from '@/lib/db';
import { buildQuoteReminderEmailHtml, buildQuoteReminderEmailSubject, quoteReminderIntro } from '@/lib/email';
import { MailAuthError, getMailAccount, openMailbox } from '@/lib/mail';

/**
 * Zelf een herinnering sturen voor een offerte die nog niet is ondertekend,
 * bijvoorbeeld een die al openstond voordat de automatische herinnering aan
 * ging. Dezelfde mail als de automatische, met de tekst uit Instellingen.
 *
 * GET geeft de mail zoals hij zou gaan (aan wie, onderwerp en tekst), zodat de
 * gebruiker hem voor deze ene offerte kan aanpassen. POST verstuurt hem vanuit
 * de eigen mailbox, met { subject, intro } als die aangepast zijn.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = (session.user as any).tenantId;
  const userId = (session.user as any).id;
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  try {
    const quote = await getQuote(id, tenantId);
    const tenant = await getTenant(tenantId);
    const customer = quote.customer;

    if (quote.signed_at || quote.status !== 'sent') {
      return res.status(400).json({ error: 'Een herinnering kan alleen bij een verstuurde offerte die nog niet is ondertekend.' });
    }
    if (!customer?.email) {
      return res.status(400).json({ error: 'Deze klant heeft geen e-mailadres. Vul dat eerst in bij de klantgegevens.' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        to: customer.email,
        subject: buildQuoteReminderEmailSubject(tenant, quote, customer),
        intro: quoteReminderIntro(tenant, quote, customer),
      });
    }

    const mailAccount = await getMailAccount(userId);
    if (!mailAccount) {
      return res.status(400).json({
        error: 'Koppel eerst je Gmail of Outlook bij Instellingen > Plug-ins; herinneringen gaan vanuit je eigen mailbox.',
      });
    }

    const subject = String(req.body?.subject || '').trim() || buildQuoteReminderEmailSubject(tenant, quote, customer);
    const intro = typeof req.body?.intro === 'string' ? req.body.intro : null;
    const html = buildQuoteReminderEmailHtml({ tenant, customer, quote, token: quote.public_token, intro });

    try {
      const mailbox = await openMailbox(userId);
      await mailbox.provider.compose(mailbox.accessToken, [customer.email], subject, html, mailbox.email);
    } catch (error) {
      if (error instanceof MailAuthError) {
        return res.status(409).json({
          error: 'De koppeling met je mailbox is verlopen. Zet hem bij Instellingen > Plug-ins opnieuw aan en probeer het nog eens.',
        });
      }
      throw error;
    }

    // Dan stuurt de automatische herinnering er niet nog een achteraan
    await updateQuote(id, tenantId, { reminder_sent_at: new Date().toISOString() } as any);

    return res.status(200).json({ success: true, sentTo: customer.email, via: mailAccount.provider });
  } catch (error: any) {
    console.error('Quote reminder error:', error);
    return res.status(500).json({ error: error.message || 'De herinnering kon niet worden verstuurd' });
  }
}
