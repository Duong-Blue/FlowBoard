import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { PageLoader } from '@/components/shared/PageLoader';
import NotFound from '@/pages/NotFound';
import { ProjectHeader } from './ProjectHeader';

export interface ProjectPageShellProps {
  containerClassName?: string;
  fullHeight?: boolean;
}

export const ProjectPageShell: React.FC<ProjectPageShellProps> = ({
  containerClassName = '',
  fullHeight = false,
}) => {
  const { t } = useTranslation(['workspace', 'common']);
  const { project, loading, is404 } = useResolvedProject();
  const location = useLocation();

  if (loading) return <PageLoader text={t('common:status.loading', { defaultValue: 'Loading...' })} />;
  if (is404 || !project) return <NotFound />;

  const isFixedLayout = fullHeight || location.pathname.includes('/work');

  return (
    <div
      className={`flex flex-col gap-6 ${
        isFixedLayout ? 'h-[calc(100vh-4rem)] pb-4' : 'min-h-[calc(100vh-4rem)]'
      } ${containerClassName}`}
    >
      <ProjectHeader project={project} title={project.name} subtitle={project.description || ''} />
      <main className="flex-1 flex flex-col min-h-0"><Outlet context={{ project }} /></main>
    </div>
  );
};
