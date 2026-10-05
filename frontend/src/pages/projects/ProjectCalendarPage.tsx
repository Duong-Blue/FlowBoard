import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PageLoader } from '@/components/shared/PageLoader';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { useAppSelector } from '@/store';
import { CalendarBoard } from '@/features/issues/components/CalendarBoard';
import NotFound from '../NotFound';

export interface ProjectCalendarPageProps {
  standalone?: boolean;
}

export default function ProjectCalendarPage({ standalone = true }: ProjectCalendarPageProps = {}) {
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

  const calendarContent = (
    <div className="flex-1 overflow-hidden">
      <CalendarBoard projectId={projectId} orgId={currentOrgId} projectKey={project.key} />
    </div>
  );

  if (standalone === false) {
    return calendarContent;
  }

  return (
    <>
      {calendarContent}
    </>
  );
}

export function ProjectCalendarView(props: ProjectCalendarPageProps) {
  return <ProjectCalendarPage standalone={false} {...props} />;
}
