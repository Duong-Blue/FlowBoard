import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../store';

const KEYWORD_MAP: Record<string, string> = {
  workspace: 'workspace',
  orgs: 'orgs',
  projects: 'projects',
  issues: 'issues',
  board: 'board',
  members: 'members',
  settings: 'settings',
  invitations: 'invitations',
  new: 'new',
};

export const AppBreadcrumb = () => {
  const { t } = useTranslation('workspace');
  const location = useLocation();
  const { orgId, projectKey } = useParams<{ orgId?: string; projectKey?: string }>();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);
  const effectiveOrgId = orgId || activeOrgId;
  const effectiveProjectKey = projectKey || activeProjectId;

  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbItems: { label: string; to: string }[] = [];

  pathnames.forEach((segment) => {
    if (segment === 'workspace') {
      breadcrumbItems.push({
        label: t(`breadcrumbs.${KEYWORD_MAP[segment]}` as any),
        to: '/workspace',
      });
    } else if (segment === 'orgs' && effectiveOrgId) {
      breadcrumbItems.push({
        label: t(`breadcrumbs.${KEYWORD_MAP[segment]}` as any),
        to: `/workspace/orgs/${effectiveOrgId}`,
      });
    } else if (segment === 'projects' && effectiveOrgId) {
      breadcrumbItems.push({
        label: t(`breadcrumbs.${KEYWORD_MAP[segment]}` as any),
        to: `/workspace/orgs/${effectiveOrgId}/projects`,
      });
    } else if (KEYWORD_MAP[segment]) {
      let targetPath = effectiveOrgId && effectiveProjectKey
        ? `/workspace/orgs/${effectiveOrgId}/projects/${effectiveProjectKey}/${segment}`
        : '/workspace';

      if (segment === 'issues' && effectiveOrgId && effectiveProjectKey) {
        targetPath = `/workspace/orgs/${effectiveOrgId}/projects/${effectiveProjectKey}/issues`;
      } else if (segment === 'board' && effectiveOrgId && effectiveProjectKey) {
        targetPath = `/workspace/orgs/${effectiveOrgId}/projects/${effectiveProjectKey}/board`;
      } else if (segment === 'members' && effectiveOrgId && effectiveProjectKey) {
        targetPath = `/workspace/orgs/${effectiveOrgId}/projects/${effectiveProjectKey}/members`;
      } else if (segment === 'settings' && effectiveOrgId && effectiveProjectKey) {
        targetPath = `/workspace/orgs/${effectiveOrgId}/projects/${effectiveProjectKey}/settings`;
      }
      breadcrumbItems.push({
        label: t(`breadcrumbs.${KEYWORD_MAP[segment]}` as any),
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
