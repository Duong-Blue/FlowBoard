import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import { RequireAuth } from './components/shared/RequireAuth';
import { RouteErrorPage } from './pages/RouteErrorPage';
import NotFound from './pages/NotFound';
import OrgMembersPage from './pages/orgs/OrgMembersPage';
import OrgDashboard from './pages/orgs/OrgDashboard';
import CreateOrgPage from './pages/orgs/CreateOrgPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import ProjectSettingsPage from './pages/projects/ProjectSettingsPage';
import ProjectMembersPage from './pages/projects/ProjectMembersPage';
import { ProjectOverviewPage } from './pages/projects/ProjectOverviewPage';
import { ProjectWorkPage } from './pages/projects/ProjectWorkPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyResetCodePage from './pages/auth/VerifyResetCodePage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ResetSuccessPage from './pages/auth/ResetSuccessPage';
import HomePage from './pages/public/HomePage';
import { ProductPage } from './pages/public/ProductPage';
import DocsLayout from './layouts/DocsLayout';
import DocsHomePage from './features/docs/pages/DocsHomePage';
import DocsArticlePage from './features/docs/pages/DocsArticlePage';
import DocsNotFoundPage from './features/docs/pages/DocsNotFoundPage';
import InvitationsPage from './pages/invitations/InvitationsPage';
import AcceptInvitationPage from './pages/invitations/AcceptInvitationPage';
import DocumentTitleHelper from './components/DocumentTitleHelper';
import OrgSettingsPage from './pages/orgs/OrgSettingsPage';
import FullSearchPage from './pages/search/FullSearchPage';
import WorkspaceHome from './pages/workspace/WorkspaceHome';
import { Toaster } from './components/ui/sonner';
import { SocketProvider } from './providers/SocketProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { ProjectPageShell } from './components/shared/ProjectPageShell';
import {
  SettingsLayout,
  ProfileSettings,
  AccountSettings,
  SecuritySettings,
  AppearanceSettings,
} from './features/settings';

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
          { path: 'product', element: <ProductPage /> },
          {
            path: 'docs',
            element: <DocsLayout />,
            children: [
              { index: true, element: <DocsHomePage /> },
              { path: 'not-found', element: <DocsNotFoundPage /> },
              { path: ':slug', element: <DocsArticlePage /> },
            ],
          },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'oauth/callback', element: <OAuthCallbackPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'verify-reset-code', element: <VerifyResetCodePage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
          { path: 'reset-success', element: <ResetSuccessPage /> },
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
              { index: true, element: <WorkspaceHome /> },
              { path: 'home', element: <WorkspaceHome /> },
              { path: 'search', element: <FullSearchPage /> },
              { path: 'orgs/new', element: <CreateOrgPage /> },
              { path: 'orgs/:orgId/overview', element: <OrgDashboard /> },
              { path: 'orgs/:orgId', element: <Navigate to="overview" replace /> },
              { path: 'orgs/:orgId/projects', element: <ProjectListPage /> },
              { path: 'orgs/:orgId/projects/new', element: <CreateProjectPage /> },
              {
                path: 'orgs/:orgSlug/projects/:projectKey',
                element: <ProjectPageShell />,
                children: [
                  { index: true, element: <Navigate to="overview" replace /> },
                  { path: 'overview', element: <ProjectOverviewPage /> },
                  { path: 'work', element: <ProjectWorkPage /> },
                  { path: 'work/issues/:issueId', element: <ProjectWorkPage /> },
                  { path: 'settings/*', element: <ProjectSettingsPage /> },
                  { path: 'members', element: <ProjectMembersPage /> },
                  { path: 'issues', element: <Navigate to="../work?view=list" replace /> },
                  { path: 'board', element: <Navigate to="../work?view=board" replace /> },
                  { path: 'calendar', element: <Navigate to="../work?view=calendar" replace /> },
                  { path: 'timeline', element: <Navigate to="../work?view=timeline" replace /> },
                ],
              },
              { path: 'orgs/:orgId/members', element: <OrgMembersPage /> },
              { path: 'orgs/:orgId/invitations', element: <InvitationsPage /> },
              { path: 'orgs/:orgId/settings', element: <OrgSettingsPage /> },
              {
                path: 'settings',
                element: <SettingsLayout />,
                children: [
                  { index: true, element: <Navigate to="profile" replace /> },
                  { path: 'profile', element: <ProfileSettings /> },
                  { path: 'account', element: <AccountSettings /> },
                  { path: 'security', element: <SecuritySettings /> },
                  { path: 'appearance', element: <AppearanceSettings /> },
                ],
              },
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
    <ThemeProvider>
      <SocketProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </SocketProvider>
    </ThemeProvider>
  );
}
