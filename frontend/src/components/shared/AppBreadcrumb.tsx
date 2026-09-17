import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../store';

const KEYWORD_MAP: Record<string, string> = {
  orgs: 'Organizations',
  projects: 'Projects',
  issues: 'Issues',
  board: 'Board',
  members: 'Members',
  settings: 'Settings',
  invitations: 'Invitations',
  new: 'New',
};

export const AppBreadcrumb = () => {
  const location = useLocation();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbItems: { label: string; to: string }[] = [];

  pathnames.forEach((segment) => {
    if (KEYWORD_MAP[segment]) {
      let targetPath = `/${segment}`;
      if (segment === 'projects' && activeOrgId) {
        targetPath = `/orgs/${activeOrgId}/projects`;
      } else if (segment === 'issues' && activeProjectId) {
        targetPath = activeOrgId 
          ? `/orgs/${activeOrgId}/projects/${activeProjectId}/issues`
          : `/projects/${activeProjectId}/issues`;
      } else if (segment === 'board' && activeProjectId) {
        targetPath = activeOrgId 
          ? `/orgs/${activeOrgId}/projects/${activeProjectId}/board`
          : `/projects/${activeProjectId}/board`;
      }
      breadcrumbItems.push({
        label: KEYWORD_MAP[segment],
        to: targetPath,
      });
    }
  });

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="flex items-center space-x-1">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        return (
          <div key={item.label + index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 mx-1" />
            )}
            {isLast ? (
              <span className="text-xs font-medium text-slate-900 truncate">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="text-xs text-slate-500 hover:text-slate-900 truncate"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
