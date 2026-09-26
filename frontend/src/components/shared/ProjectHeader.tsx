import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, LayoutList, Calendar as CalendarIcon, Users, Settings } from 'lucide-react';
import { AppBreadcrumb } from './AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import type { Project } from '@/store/types';

export interface ProjectHeaderProps {
  project?: Project | null;
  title?: string;
  subtitle?: string;
  activeView?: 'board' | 'list' | 'calendar' | 'members' | 'settings' | 'none';
  realtimeIndicator?: React.ReactNode;
  actions?: React.ReactNode;
  showViewSwitcher?: boolean;
  className?: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project: propProject,
  title,
  subtitle,
  activeView: propActiveView,
  realtimeIndicator,
  actions,
  showViewSwitcher = true,
  className = '',
}) => {
  const { t } = useTranslation(['issues', 'workspace', 'common']);
  const location = useLocation();
  const { orgId } = useParams<{ orgId: string }>();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const resolved = useResolvedProject();

  const project = propProject || resolved.project;
  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;
  const projectKey = project?.key;

  // Determine active view from props or location pathname
  const derivedActiveView = React.useMemo(() => {
    if (propActiveView) return propActiveView;
    const path = location.pathname;
    if (path.endsWith('/board')) return 'board';
    if (path.endsWith('/issues') || path.includes('/issues?')) return 'list';
    if (path.endsWith('/calendar')) return 'calendar';
    if (path.endsWith('/members')) return 'members';
    if (path.endsWith('/settings')) return 'settings';
    return 'none';
  }, [location.pathname, propActiveView]);

  const viewLinks = React.useMemo(() => {
    if (!currentOrgId || !projectKey) return null;
    const base = `/workspace/orgs/${currentOrgId}/projects/${projectKey}`;
    return {
      board: `${base}/board`,
      list: `${base}/issues`,
      calendar: `${base}/calendar`,
      members: `${base}/members`,
      settings: `${base}/settings`,
    };
  }, [currentOrgId, projectKey]);

  return (
    <header className={`flex flex-col gap-4 pb-4 border-b border-slate-200 ${className}`}>
      {/* Top Bar: Breadcrumb + Navigation (Members, Settings) */}
      <div className="flex items-center justify-between gap-4">
        <AppBreadcrumb />
        {viewLinks && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant={derivedActiveView === 'members' ? 'secondary' : 'ghost'}
              size="sm"
              className={`min-h-[44px] md:min-h-0 h-11 md:h-8 px-3 text-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                derivedActiveView === 'members' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              asChild
            >
              <Link
                to={viewLinks.members}
                aria-current={derivedActiveView === 'members' ? 'page' : undefined}
                aria-label={t('workspace:sidebar.members', { defaultValue: 'Members' })}
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline" aria-hidden="true">{t('workspace:sidebar.members', { defaultValue: 'Members' })}</span>
              </Link>
            </Button>
            <Button
              variant={derivedActiveView === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              className={`min-h-[44px] md:min-h-0 h-11 md:h-8 px-3 text-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                derivedActiveView === 'settings' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              asChild
            >
              <Link
                to={viewLinks.settings}
                aria-current={derivedActiveView === 'settings' ? 'page' : undefined}
                aria-label={t('workspace:sidebar.settings', { defaultValue: 'Settings' })}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline" aria-hidden="true">{t('workspace:sidebar.settings', { defaultValue: 'Settings' })}</span>
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Main Header Row: Identity, Realtime Indicator, View Switcher & Custom Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Title & Key Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                {title || project?.name || t('workspace:sidebar.currentProject', { defaultValue: 'Project' })}
              </h1>
              {projectKey && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
                  {projectKey}
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {realtimeIndicator && <div className="flex items-center">{realtimeIndicator}</div>}
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {showViewSwitcher && viewLinks && (
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 shrink-0">
              <Button
                variant={derivedActiveView === 'board' ? 'default' : 'ghost'}
                size="sm"
                className={`min-h-[44px] md:min-h-0 h-11 md:h-8 px-3 text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  derivedActiveView === 'board' ? 'shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                asChild={derivedActiveView !== 'board'}
                aria-current={derivedActiveView === 'board' ? 'page' : undefined}
              >
                {derivedActiveView === 'board' ? (
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    {t('board.boardView', { defaultValue: 'Board' })}
                  </span>
                ) : (
                  <Link to={viewLinks.board}>
                    <LayoutDashboard className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    {t('board.boardView', { defaultValue: 'Board' })}
                  </Link>
                )}
              </Button>

              <Button
                variant={derivedActiveView === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={`min-h-[44px] md:min-h-0 h-11 md:h-8 px-3 text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  derivedActiveView === 'list' ? 'shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                asChild={derivedActiveView !== 'list'}
                aria-current={derivedActiveView === 'list' ? 'page' : undefined}
              >
                {derivedActiveView === 'list' ? (
                  <span className="flex items-center gap-1.5">
                    <LayoutList className="h-4 w-4" aria-hidden="true" />
                    {t('board.listView', { defaultValue: 'List' })}
                  </span>
                ) : (
                  <Link to={viewLinks.list}>
                    <LayoutList className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    {t('board.listView', { defaultValue: 'List' })}
                  </Link>
                )}
              </Button>

              <Button
                variant={derivedActiveView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                className={`min-h-[44px] md:min-h-0 h-11 md:h-8 px-3 text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  derivedActiveView === 'calendar' ? 'shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                asChild={derivedActiveView !== 'calendar'}
                aria-current={derivedActiveView === 'calendar' ? 'page' : undefined}
              >
                {derivedActiveView === 'calendar' ? (
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                    {t('board.calendarView', { defaultValue: 'Calendar' })}
                  </span>
                ) : (
                  <Link to={viewLinks.calendar}>
                    <CalendarIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    {t('board.calendarView', { defaultValue: 'Calendar' })}
                  </Link>
                )}
              </Button>
            </div>
          )}

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
};
