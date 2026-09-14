import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import NotFound from './pages/NotFound';
import OrgMembersPage from './pages/orgs/OrgMembersPage';
import OrgDashboard from './pages/orgs/OrgDashboard';
import CreateOrgPage from './pages/orgs/CreateOrgPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import ProjectSettingsPage from './pages/projects/ProjectSettingsPage';
import ProjectMembersPage from './pages/projects/ProjectMembersPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import InvitationsPage from './pages/invitations/InvitationsPage';
import AcceptInvitationPage from './pages/invitations/AcceptInvitationPage';
import DocumentTitleHelper from './components/DocumentTitleHelper';
import OrgSettingsPage from './pages/orgs/OrgSettingsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <DocumentTitleHelper />
        <RootLayout />
      </>
    ),
    errorElement: <NotFound />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'invitations/accept', element: <AcceptInvitationPage /> },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <OrgDashboard /> },
          { path: 'orgs/new', element: <CreateOrgPage /> },
          { path: 'orgs/:orgId/projects', element: <ProjectListPage /> },
          { path: 'orgs/:orgId/projects/new', element: <CreateProjectPage /> },
          { path: 'orgs/:orgId/projects/:projectId/members', element: <ProjectMembersPage /> },
          { path: 'orgs/:orgId/projects/:projectId/settings', element: <ProjectSettingsPage /> },
          { path: 'org/:orgId/project/:projectId', element: <div>TODO Project Board Page</div> },
          { path: 'orgs/:orgId/members', element: <OrgMembersPage /> },
          { path: 'orgs/:orgId/invitations', element: <InvitationsPage /> },
          { path: 'orgs/:orgId/settings', element: <OrgSettingsPage /> },
          { path: 'settings', element: <div>TODO Settings Page</div> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
