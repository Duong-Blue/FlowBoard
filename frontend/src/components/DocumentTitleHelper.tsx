import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';

export default function DocumentTitleHelper() {
  const location = useLocation();
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);

  useEffect(() => {
    const path = location.pathname;
    let title = 'FlowBoard';

    // Regex to capture projectKey from the new route structure
    const projectRouteMatch = path.match('^/workspace/orgs/[^/]+/projects/([^/]+)(.*)$');
    const projectKeyFromUrl = projectRouteMatch ? projectRouteMatch[1] : null;
    const subPath = projectRouteMatch ? projectRouteMatch[2] : null;

    // Use projectKey from URL if available, otherwise fall back to activeProjectId from store
    const currentProjectKey = projectKeyFromUrl || (activeProjectId ? String(activeProjectId) : null);

    if (path.startsWith('/login')) title = 'Login | FlowBoard';
    else if (path.startsWith('/register')) title = 'Register | FlowBoard';
    else if (currentProjectKey && subPath) {
      if (subPath === '/issues') title = `Issues - ${currentProjectKey} | FlowBoard`;
      else if (subPath === '/board') title = `Board - ${currentProjectKey} | FlowBoard`;
      else if (subPath === '/members') title = `Members - ${currentProjectKey} | FlowBoard`;
      else if (subPath === '/settings') title = `Settings - ${currentProjectKey} | FlowBoard`;
      else title = `${currentProjectKey} | FlowBoard`; // Default for project routes
    } else if (path.includes('/projects/new')) title = 'New Project | FlowBoard';
    else if (path.includes('/projects')) title = 'Projects | FlowBoard';
    else if (path.includes('/orgs/new')) title = 'New Organization | FlowBoard';
    else if (path.includes('/orgs')) title = 'Organization | FlowBoard';
    else if (path === '/settings') title = 'Settings | FlowBoard';

    document.title = title;
  }, [location]);

  return null;
}
