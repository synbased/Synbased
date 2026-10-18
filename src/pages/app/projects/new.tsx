import HelpButton from '@/components/HelpButton';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useToast } from '@/components/Toast';
import ProjectFields, { EMPTY_PROJECT, validateProject, type ProjectFormData } from '@/components/ProjectFields';
import type { Customer } from '@/lib/supabase';
import { getCustomerOptionLabel } from '@/lib/utils';

export default function NewProject() {
  const toast = useToast();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>(EMPTY_PROJECT);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => (res.ok ? res.json() : []))
      .then(setCustomers)
      .catch(() => {});
  }, []);

  // Vanuit een klant staat die klant al goed
  useEffect(() => {
    if (typeof router.query.customer_id === 'string') {
      setFormData(prev => ({ ...prev, customer_id: router.query.customer_id as string }));
    }
  }, [router.query.customer_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (Object.keys(validateProject(formData)).length > 0) {
      toast.error('Nog niet compleet', 'Vul de gemarkeerde velden in');
      return;
    }
    setIsLoading(true);

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error('Fout', data.error || 'Er is iets misgegaan');
      setIsLoading(false);
      return;
    }
    router.push(`/app/projects/${data.id}`);
  };

  const customerOptions = customers.map(c => ({ value: String(c.id), label: getCustomerOptionLabel(c) }));

  return (
    <Layout title="Nieuw project">
      <div className="header">
        <h1>Nieuw project <HelpButton topic="projects" /></h1>
        <div className="actions">
          <button type="button" className="button cancel" onClick={() => router.back()}>
            Annuleren
          </button>
          <button type="submit" form="project-form" className="button" disabled={isLoading}>
            {isLoading ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>

      <div className="block">
        <form id="project-form" onSubmit={handleSubmit}>
          <ProjectFields
            formData={formData}
            onChange={setFormData}
            customerOptions={customerOptions}
            errors={showErrors ? validateProject(formData) : {}}
          />
        </form>
      </div>
    </Layout>
  );
}
