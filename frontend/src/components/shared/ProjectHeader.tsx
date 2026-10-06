import React from 'react';
import { useTranslation } from 'react-i18next';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import type { Project } from '@/store/types';

export interface ProjectHeaderProps {
  project?: Project | null;
  title?: string;
  subtitle?: string;
  activeView?: 'board' | 'list' | 'calendar' | 'timeline' | 'members' | 'settings' | 'none';
  realtimeIndicator?: React.ReactNode;
  actions?: React.ReactNode;
  showViewSwitcher?: boolean;
  className?: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project: propProject,
  title,
  subtitle,
  realtimeIndicator,
  className = '',
}) => {
  const { t } = useTranslation(['issues', 'workspace', 'common']);
  const resolved = useResolvedProject();

  const project = propProject || resolved.project;
  const projectKey = project?.key;

  return (
    <header className={`flex flex-col gap-4 pb-4 border-b border-slate-200 ${className}`}>
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
      </div>
    </header>
  );
};
