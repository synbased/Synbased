import Select, { type SelectOption } from '@/components/Select';
import DatePicker from '@/components/DatePicker';
import { PROJECT_STATUS } from '@/lib/constants';

const statusOptions = Object.entries(PROJECT_STATUS).map(([value, { label }]) => ({ value, label }));

export interface ProjectFormData {
  name: string;
  customer_id: string;
  status: string;
  address: string;
  start_date: string;
  end_date: string;
  description: string;
}

export type ProjectErrors = Partial<Record<'name', string>>;

export const EMPTY_PROJECT: ProjectFormData = {
  name: '',
  customer_id: '',
  status: 'planned',
  address: '',
  start_date: '',
  end_date: '',
  description: '',
};

/** Wat er nog ontbreekt; leeg als het project opgeslagen kan worden */
export function validateProject(formData: ProjectFormData): ProjectErrors {
  return formData.name.trim() ? {} : { name: 'Geef het project een naam' };
}

/**
 * De velden van een project, voor nieuw en bewerken. Zelfde opbouw als bij
 * Notities en Kosten: links wat het is, rechts het veld.
 */
export default function ProjectFields({
  formData,
  onChange,
  customerOptions,
  errors = {},
}: {
  formData: ProjectFormData;
  onChange: (formData: ProjectFormData) => void;
  customerOptions: SelectOption[];
  errors?: ProjectErrors;
}) {
  return (
    <>
      <div className="row-section">
        <div className="information">
          <label className="title" htmlFor="name">Naam</label>
          <span className="description">Kort en herkenbaar, zoals &quot;Badkamer Familie Verhoef&quot;.</span>
        </div>
        <div className={errors.name ? 'invalid' : ''}>
          <input
            id="name"
            type="text"
            value={formData.name}
            aria-invalid={!!errors.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            placeholder="Vul een naam in"
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
      </div>

      <div className="row-section">
        <div className="information">
          <span className="title">Klant</span>
          <span className="description">Voor wie de klus is; nieuwe offertes en facturen krijgen deze klant.</span>
        </div>
        <div>
          <Select
            value={customerOptions.find(o => o.value === formData.customer_id) || null}
            onChange={(option) => onChange({ ...formData, customer_id: option?.value || '' })}
            options={customerOptions}
            placeholder="Selecteer een klant"
            isClearable
          />
        </div>
      </div>

      <div className="row-section">
        <div className="information">
          <span className="title">Fase</span>
          <span className="description">Waar de klus staat: van offerte tot opgeleverd.</span>
        </div>
        <div>
          <Select
            value={statusOptions.find(o => o.value === formData.status) || null}
            onChange={(option) => onChange({ ...formData, status: option?.value || 'planned' })}
            options={statusOptions}
          />
        </div>
      </div>

      <div className="row-section">
        <div className="information">
          <label className="title" htmlFor="address">Adres van de klus</label>
          <span className="description">Als dat een ander adres is dan dat van de klant.</span>
        </div>
        <div>
          <input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => onChange({ ...formData, address: e.target.value })}
            placeholder="Vul een adres in"
          />
        </div>
      </div>

      <div className="row-section">
        <div className="information">
          <span className="title">Planning</span>
          <span className="description">Wanneer de klus begint en klaar is.</span>
        </div>
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>Start</label>
              <DatePicker
                value={formData.start_date}
                onChange={(start_date) => onChange({ ...formData, start_date })}
                placeholder="Selecteer een datum"
              />
            </div>
            <div className="form-group">
              <label>Oplevering</label>
              <DatePicker
                value={formData.end_date}
                onChange={(end_date) => onChange({ ...formData, end_date })}
                placeholder="Selecteer een datum"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row-section">
        <div className="information">
          <label className="title" htmlFor="description">Omschrijving</label>
          <span className="description">Wat er moet gebeuren, kort.</span>
        </div>
        <div>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            placeholder="Vul een omschrijving in"
            rows={4}
          />
        </div>
      </div>
    </>
  );
}
