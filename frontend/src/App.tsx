import { createBrowserRouter, RouterProvider, useSearchParams, Outlet, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import { RequireAuth } from './components/shared/RequireAuth';
import WorkspaceIndexRedirect from './components/shared/WorkspaceIndexRedirect';
import { RouteErrorPage } from './pages/RouteErrorPage';
import NotFound from './pages/NotFound';
import OrgMembersPage from './pages/orgs/OrgMembersPage';
import OrgDashboard from './pages/orgs/OrgDashboard';
import CreateOrgPage from './pages/orgs/CreateOrgPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import ProjectSettingsPage from './pages/projects/ProjectSettingsPage';
import ProjectMembersPage from './pages/projects/ProjectMembersPage';
import IssueListPage from './pages/projects/IssueListPage';
import BoardPage from './pages/projects/BoardPage';
import ProjectCalendarPage from './pages/projects/ProjectCalendarPage';
import { IssueDetailPage } from './features/issues/pages/IssueDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/public/HomePage';
import InvitationsPage from './pages/invitations/InvitationsPage';
import AcceptInvitationPage from './pages/invitations/AcceptInvitationPage';
import DocumentTitleHelper from './components/DocumentTitleHelper';
import OrgSettingsPage from './pages/orgs/OrgSettingsPage';
import { Toaster } from './components/ui/sonner';
import { SocketProvider } from './providers/SocketProvider';

function ProjectIssuesLayout({ defaultView }: { defaultView?: 'board' | 'list' | 'calendar' }) {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView = viewParam || defaultView;

  const baseView =
    activeView === 'list' ? (
      <IssueListPage />
    ) : activeView === 'calendar' ? (
      <ProjectCalendarPage />
    ) : (
      <BoardPage />
    );

  return (
    <>
      {baseView}
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: (
      <>
        <DocumentTitleHelper />
        <Outlet />
      </>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <HomePage /> },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'invitations/accept', element: <AcceptInvitationPage /> },
        ],
      },
      {
        path: 'workspace',
        element: <RequireAuth />,
        children: [
          {
            element: <WorkspaceLayout />,
            children: [
              { index: true, element: <WorkspaceIndexRedirect /> },
              { path: 'orgs/new', element: <CreateOrgPage /> },
              { path: 'orgs/:orgId/overview', element: <OrgDashboard /> },
              { path: 'orgs/:orgId', element: <Navigate to="overview" replace /> },
              { path: 'orgs/:orgId/projects', element: <ProjectListPage /> },
              { path: 'orgs/:orgId/projects/new', element: <CreateProjectPage /> },
              {
                path: 'orgs/:orgId/projects/:projectKey',
                element: <ProjectIssuesLayout />,
                children: [
                  { index: true, element: null },
                  { path: 'issues/:issueId', element: <IssueDetailPage /> },
                ],
              },
              {
                path: 'orgs/:orgId/projects/:projectKey/issues',
                element: <ProjectIssuesLayout />,
                children: [
                  { index: true, element: null },
                  { path: ':issueId', element: <IssueDetailPage /> },
                ],
              },
              {
                path: 'orgs/:orgId/projects/:projectKey/board',
                element: <ProjectIssuesLayout defaultView="board" />,
                children: [
                  { index: true, element: null },
                  { path: 'issues/:issueId', element: <IssueDetailPage /> },
                ],
              },
              {
                path: 'orgs/:orgId/projects/:projectKey/calendar',
                element: <ProjectIssuesLayout defaultView="calendar" />,
                children: [
                  { index: true, element: null },
                  { path: 'issues/:issueId', element: <IssueDetailPage /> },
                ],
              },
              { path: 'orgs/:orgId/projects/:projectKey/members', element: <ProjectMembersPage /> },
              { path: 'orgs/:orgId/projects/:projectKey/settings', element: <ProjectSettingsPage /> },
              { path: 'orgs/:orgId/members', element: <OrgMembersPage /> },
              { path: 'orgs/:orgId/invitations', element: <InvitationsPage /> },
              { path: 'orgs/:orgId/settings', element: <OrgSettingsPage /> },
              { path: 'settings', element: <div>TODO Settings Page</div> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return (
    <SocketProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </SocketProvider>
  );
}
