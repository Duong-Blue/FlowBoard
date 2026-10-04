import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PageLoader } from '@/components/shared/PageLoader';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBoardIssues } from '@/store/slices/issueSlice';
import { IssueTimelineView } from '@/features/issues/components/IssueTimelineView';
import NotFound from '../NotFound';

export default function ProjectTimelinePage() {
  const { t } = useTranslation('issues');
  const dispatch = useAppDispatch();
  const { orgId } = useParams<{ orgId: string }>();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchBoardIssues(projectId));
    }
  }, [projectId, dispatch]);

  if (projectLoading) {
    return <PageLoader text={t('common:status.loading', { defaultValue: 'Loading timeline...' })} />;
  }

  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;

  if (is404 || !project || !projectId || !currentOrgId || !project.key) {
    return <NotFound />;
  }

  return (
    <ProjectPageShell
      project={project}
      title={t('board.timelineView', { defaultValue: 'Timeline' })}
      activeView="timeline"
      fullHeight
    >
      <div className="flex-1 overflow-hidden p-2">
        <IssueTimelineView />
      </div>
    </ProjectPageShell>
  );
}
