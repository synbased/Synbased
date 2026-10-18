import HelpButton from '@/components/HelpButton';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Ellipsis, FolderKanban, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';
import { SkeletonTable } from '@/components/Skeleton';
import { usePagination } from '@/hooks/usePagination';
import { useConfirm } from '@/hooks/useConfirm';
import { PROJECT_STATUS } from '@/lib/constants';
import { formatDate, getCustomerDisplayName } from '@/lib/utils';
import type { Customer, Project } from '@/lib/supabase';

type ProjectRow = Project & { customer: Partial<Customer> | null };

/**
 * Projecten: je klussen, elk met de offertes, facturen, kosten en notities
 * die erbij horen. Opgezet zoals Notities: zoeken en per rij een menu.
 */
export default function Projects() {
  const { confirm } = useConfirm();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? projects.filter((project) =>
        [project.name, project.address, project.customer ? getCustomerDisplayName(project.customer) : '']
          .some(value => (value || '').toLowerCase().includes(term))
      )
    : projects;
  const pagination = usePagination(filtered);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpenDropdownId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      setProjects(res.ok ? await res.json() : []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Project verwijderen',
      message: 'Weet je zeker dat je dit project wilt verwijderen? De offertes, facturen, kosten en notities blijven bestaan, alleen zonder project.',
      confirmText: 'Verwijderen',
      negative: true,
      cancelText: 'Annuleren',
    });
    if (!confirmed) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    fetchProjects();
  };

  return (
    <Layout title="Projecten">
      <div className="header">
        <h1>Projecten <HelpButton topic="projects" /></h1>
        <div className="actions">
          {!isLoading && <SearchInput value={searchTerm} label="Zoeken in projecten" onChange={setSearchTerm} />}
          <Link href="/app/projects/new" className="button">
            Project toevoegen
          </Link>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? <Search size={22} /> : <FolderKanban size={22} />}
          <h2>{searchTerm ? 'Geen projecten gevonden' : 'Geen projecten'}</h2>
          <p>
            {searchTerm
              ? 'Probeer een andere zoekterm.'
              : 'Maak een project per klus en zet de offerte, facturen, kosten en notities erbij.'}
          </p>
        </div>
      ) : (
        <>
          <Table headers={['Project', 'Klant', 'Fase', 'Start', 'Oplevering', '']}>
            {pagination.pageItems.map((project, index) => (
              <tr key={project.id}>
                <td className="note-cell">
                  <Link href={`/app/projects/${project.id}`} className="title">
                    {project.name}
                  </Link>
                </td>
                <td>{project.customer ? getCustomerDisplayName(project.customer) : '-'}</td>
                <td>
                  <span className={`status-badge ${PROJECT_STATUS[project.status]?.className || ''}`}>
                    {PROJECT_STATUS[project.status]?.label || project.status}
                  </span>
                </td>
                <td>{formatDate(project.start_date) || '-'}</td>
                <td>{formatDate(project.end_date) || '-'}</td>
                <td className="actions">
                  <div
                    className={`action-dropdown${index >= pagination.pageItems.length - 4 && pagination.pageItems.length > 4 ? ' up' : ''}`}
                    ref={openDropdownId === project.id ? dropdownRef : null}
                  >
                    <button onClick={() => setOpenDropdownId(openDropdownId === project.id ? null : project.id)}>
                      <Ellipsis size={18} />
                    </button>
                    {openDropdownId === project.id && (
                      <div className="action-menu">
                        <Link href={`/app/projects/${project.id}`} className="edit">
                          Bekijken
                        </Link>
                        <Link
                          href=""
                          className="delete"
                          onClick={() => {
                            setOpenDropdownId(null);
                            handleDelete(project.id);
                          }}
                        >
                          Verwijderen
                        </Link>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </>
      )}
    </Layout>
  );
}
