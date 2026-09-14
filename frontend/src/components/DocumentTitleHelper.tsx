import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function DocumentTitleHelper() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'FlowBoard';

    if (path.startsWith('/login')) title = 'Login | FlowBoard';
    else if (path.startsWith('/register')) title = 'Register | FlowBoard';
    else if (path.includes('/projects/new')) title = 'New Project | FlowBoard';
    else if (path.includes('/projects')) title = 'Projects | FlowBoard';
    else if (path.includes('/orgs/new')) title = 'New Organization | FlowBoard';
    else if (path.includes('/orgs')) title = 'Organization | FlowBoard';
    else if (path === '/settings') title = 'Settings | FlowBoard';

    document.title = title;
  }, [location]);

  return null;
}
