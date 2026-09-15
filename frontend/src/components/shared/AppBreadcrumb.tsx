import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../store';

const KEYWORD_MAP: Record<string, string> = {
  orgs: 'Organizations',
  projects: 'Projects',
  members: 'Members',
  settings: 'Settings',
  invitations: 'Invitations',
  new: 'New',
};

export const AppBreadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const orgs = useAppSelector((state) => state.org.list);
  const projects = useAppSelector((state) => state.project.list);

  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="flex items-center space-x-1">
      {pathnames.map((segment, index) => {
        const isLast = index === pathnames.length - 1;
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;

        let displayName = segment;
        const prevSegment = index > 0 ? pathnames[index - 1] : null;

        if (KEYWORD_MAP[segment]) {
          displayName = KEYWORD_MAP[segment];
        } else if (prevSegment === 'orgs') {
          const org = orgs.find((o) => o.id === segment);
          if (org) displayName = org.name;
        } else if (prevSegment === 'projects') {
          const project = projects.find((p) => p.id === segment);
          if (project) displayName = project.name;
        } else {
          // fallback formatting: Capitalize first letter if it's not an ID (naive check)
          if (segment.length < 20) {
             displayName = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
        }

        return (
          <div key={routeTo} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 mx-1" />
            )}
            {isLast ? (
              <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                {displayName}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="text-xs text-slate-500 hover:text-slate-900 font-normal truncate max-w-[150px]"
              >
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
