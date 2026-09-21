import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { LayoutList, LayoutDashboard, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/shared/PageLoader';
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
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
      {/* View Header & Navigation Tabs */}
      <div className="flex-none flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('board.title', { defaultValue: 'Board' })}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/workspace/orgs/${currentOrgId}/projects/${project.key}/board`}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('board.boardView', { defaultValue: 'Board' })}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/workspace/orgs/${currentOrgId}/projects/${project.key}/issues?view=list`}>
              <LayoutList className="mr-2 h-4 w-4" />
              {t('board.listView', { defaultValue: 'List' })}
            </Link>
          </Button>
          <Button variant="default" size="sm" className="pointer-events-none opacity-90">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {t('board.calendarView', { defaultValue: 'Calendar' })}
          </Button>
        </div>
      </div>

      {/* Calendar Board View */}
      <div className="flex-1 overflow-hidden">
        <CalendarBoard projectId={projectId} orgId={currentOrgId} projectKey={project.key} />
      </div>
    </div>
  );
}
