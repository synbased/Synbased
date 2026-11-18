import { useEffect, useState } from 'react';
import type { SelectOption } from '@/components/Select';

/**
 * De projecten van het bedrijf als keuzelijst, voor het veld Project bij een
 * offerte, factuur, kostenpost of notitie. Lopende projecten eerst; een
 * opgeleverd project staat er nog wel in, onderaan.
 */
export function useProjects(): SelectOption[] {
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => (res.ok ? res.json() : []))
      .then((projects: { id: number; name: string; status: string }[]) =>
        setOptions(
          [...projects]
            .sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed'))
            .map(project => ({ value: String(project.id), label: project.name }))
        )
      )
      .catch(() => setOptions([]));
  }, []);

  return options;
}
