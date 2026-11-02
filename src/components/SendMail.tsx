import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import RichTextEditor from '@/components/RichTextEditor';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { readJson } from '@/lib/utils';

interface SendMailProps {
  isOpen: boolean;
  /** Zoals "Offerte versturen" */
  title: string;
  /** De verstuurroute: GET geeft het voorstel, POST verstuurt */
  endpoint: string;
  /** Wat er onder de tekst in de mail komt, zoals de knop naar de offerte */
  note: string;
  onClose: () => void;
  /** Na het versturen, met het antwoord van de server */
  onSent: (data: any) => void;
}

/**
 * De mail bekijken voordat hij weggaat. Onderwerp en tekst komen uit
 * Instellingen en zijn hier voor deze ene offerte of factuur aan te passen;
 * Instellingen zelf blijft zoals het is.
 */
export default function SendMail({ isOpen, title, endpoint, note, onClose, onSent }: SendMailProps) {
  const toast = useToast();
  const [mail, setMail] = useState<{ to: string; subject: string; intro: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMail(null);

    fetch(endpoint)
      .then(async (response) => {
        const data = await readJson(response);
        if (!response.ok) throw new Error(data.error || 'Er is iets misgegaan');
        setMail({ to: data.to, subject: data.subject, intro: data.intro });
      })
      .catch((error) => {
        toast.error('Versturen kan nog niet', error.message);
        onClose();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, endpoint]);

  const send = async () => {
    if (!mail) return;
    setIsSending(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: mail.subject, intro: mail.intro }),
      });
      const data = await readJson(response);
      if (!response.ok) {
        toast.error('Versturen mislukt', data.error || 'Er is iets misgegaan');
        return;
      }
      onSent(data);
    } catch {
      toast.error('Versturen mislukt', 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !isSending && onClose()} title={title}>
      <div className="send-mail">
        {!mail ? (
          <div className="form-section">
            <Skeleton height="2.5rem" width="100%" />
            <Skeleton height="2.5rem" width="100%" />
            <Skeleton height="10rem" width="100%" />
          </div>
        ) : (
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="send-to">Aan</label>
              <input id="send-to" type="text" value={mail.to} disabled />
            </div>
            <div className="form-group">
              <label htmlFor="send-subject">Onderwerp</label>
              <input
                id="send-subject"
                type="text"
                value={mail.subject}
                onChange={(event) => setMail({ ...mail, subject: event.target.value })}
                placeholder="Vul een onderwerp in"
              />
              {mail.subject.includes('{{') && (
                <p className="field-note">Een tag als {'{{factuurnummer}}'} wordt bij het versturen ingevuld.</p>
              )}
            </div>
            <div className="form-group">
              <label>Bericht</label>
              <RichTextEditor
                value={mail.intro}
                onChange={(intro) => setMail({ ...mail, intro })}
                placeholder="Vul een tekst in"
              />
              <p className="field-note">{note}</p>
            </div>
          </div>
        )}

        <div className="buttons">
          <button type="button" className="button cancel" onClick={onClose} disabled={isSending}>
            Annuleren
          </button>
          <button type="button" className="button" onClick={send} disabled={!mail || isSending}>
            {isSending ? <><LoaderCircle size={14} className="spinner" />Versturen...</> : 'Versturen'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
