import { useParams, useSearchParams, Outlet } from 'react-router-dom';
import BoardPage from './BoardPage';
import IssueListPage from './IssueListPage';
import ProjectCalendarPage from './ProjectCalendarPage';
import { IssueDetailPage } from '@/features/issues/pages/IssueDetailPage';

export function ProjectWorkPage() {
  const [searchParams] = useSearchParams();
  const { issueId } = useParams<{ issueId?: string }>();
  const viewParam = searchParams.get('view');

  const baseView =
    viewParam === 'list' ? (
      <IssueListPage />
    ) : viewParam === 'calendar' ? (
      <ProjectCalendarPage />
    ) : (
      <BoardPage />
    );

  return (
    <>
      {baseView}
      {issueId && <IssueDetailPage />}
      <Outlet />
    </>
  );
}

export default ProjectWorkPage;
