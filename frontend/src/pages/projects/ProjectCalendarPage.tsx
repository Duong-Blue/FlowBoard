import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PageLoader } from '@/components/shared/PageLoader';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { useAppSelector } from '@/store';
import { CalendarBoard } from '@/features/issues/components/CalendarBoard';
import NotFound from '../NotFound';

export default function ProjectCalendarPage() {
  const { t } = useTranslation('issues');
  const { orgId } = useParams<{ orgId: string }>();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  if (projectLoading) {
    return <PageLoader text={t('common:status.loading', { defaultValue: 'Loading calendar...' })} />;
  }

  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;

  if (is404 || !project || !projectId || !currentOrgId || !project.key) {
    return <NotFound />;
  }

  return (
    <ProjectPageShell
      project={project}
      title={t('board.calendarView', { defaultValue: 'Calendar' })}
      activeView="calendar"
      fullHeight
    >
      <div className="flex-1 overflow-hidden">
        <CalendarBoard projectId={projectId} orgId={currentOrgId} projectKey={project.key} />
      </div>
    </ProjectPageShell>
  );
}
