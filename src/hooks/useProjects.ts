import { useEffect, useState } from 'react';
import type { SelectOption } from '@/components/Select';

/**
 * De projecten van het bedrijf als keuzelijst, voor het veld Project bij een
 * offerte, factuur, kostenpost of notitie. Lopende projecten eerst; een
 * opgeleverd project staat er nog wel in, onderaan.
 */
export function useProjects(): (SelectOption & { address: string | null })[] {
  const [options, setOptions] = useState<(SelectOption & { address: string | null })[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => (res.ok ? res.json() : []))
      .then((projects: { id: number; name: string; status: string; address: string | null }[]) =>
        setOptions(
          [...projects]
            .sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed'))
            .map(project => ({ value: String(project.id), label: project.name, address: project.address }))
        )
      )
      .catch(() => setOptions([]));
  }, []);

  return options;
}
