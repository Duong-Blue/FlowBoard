import { useTranslation } from 'react-i18next';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { PageLoader } from '@/components/shared/PageLoader';
import NotFound from '../NotFound';
import { ProjectMembersTab } from '@/features/projects/components/ProjectMembersTab';

export default function ProjectMembersPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { project, loading: projectLoading, is404 } = useResolvedProject();

  if (projectLoading) return <PageLoader text={t('common:status.loading')} />;
  if (is404 || !project) return <NotFound />;

  return (
    <ProjectPageShell
      project={project}
      title={t('projects.membersTitle')}
      subtitle={t('projects.membersSubtitle')}
      activeView="members"
    >
      <div className="max-w-4xl mt-2">
        <ProjectMembersTab />
      </div>
    </ProjectPageShell>
  );
}
