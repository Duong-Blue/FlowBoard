import { createBrowserRouter, RouterProvider, useSearchParams, Outlet, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import { RequireAuth } from './components/shared/RequireAuth';
import WorkspaceIndexRedirect from './components/shared/WorkspaceIndexRedirect';
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
import { IssueDetailPage } from './features/issues/pages/IssueDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import InvitationsPage from './pages/invitations/InvitationsPage';
import AcceptInvitationPage from './pages/invitations/AcceptInvitationPage';
import DocumentTitleHelper from './components/DocumentTitleHelper';
import OrgSettingsPage from './pages/orgs/OrgSettingsPage';
import { Toaster } from './components/ui/sonner';
import { SocketProvider } from './providers/SocketProvider';

function ProjectIssuesRoute() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  if (view === 'list') {
    return <IssueListPage />;
  }
  return <BoardPage />;
}

const router = createBrowserRouter([
  {
    element: (
      <>
        <DocumentTitleHelper />
        <Outlet />
      </>
    ),
    errorElement: <NotFound />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <Navigate to="/workspace" replace /> },
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
              { path: 'orgs/:orgId/projects/:projectKey', element: <ProjectIssuesRoute /> },
              { path: 'orgs/:orgId/projects/:projectKey/issues', element: <ProjectIssuesRoute /> },
              { path: 'orgs/:orgId/projects/:projectKey/issues/:issueId', element: <IssueDetailPage /> },
              { path: 'orgs/:orgId/projects/:projectKey/board', element: <BoardPage /> },
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
