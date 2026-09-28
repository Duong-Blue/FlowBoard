import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProjectCard } from './ProjectCard';
import type { Project } from '@/store/types';

export interface ProjectsSectionProps {
  projects: Project[];
  title?: string;
  onCreateProject?: () => void;
  className?: string;
  emptyStateMessage?: string;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  title,
  onCreateProject,
  className,
  emptyStateMessage,
}) => {
  const { t } = useTranslation(['workspace', 'common']);

  const hasRecentTimestamp =
    projects.length > 0 && projects.some((p) => Boolean(p.lastAccessedAt));

  const defaultTitle = hasRecentTimestamp
    ? t('orgDashboard.recentProjects', { defaultValue: 'Recent Projects' })
    : t('projects.title', { defaultValue: 'Projects' });

  const sectionTitle = title || defaultTitle;
  const noProjectsText =
    emptyStateMessage || t('orgDashboard.noProjects', { defaultValue: 'No projects found.' });

  return (
    <section className={`space-y-4 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{sectionTitle}</h2>
        {onCreateProject && projects.length > 0 && (
          <Button
            onClick={onCreateProject}
            size="sm"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>{t('projects.createProject', { defaultValue: 'Create Project' })}</span>
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-slate-300 bg-slate-50/50 rounded-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3">
            <FolderPlus className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">{noProjectsText}</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            {t('projects.createSubtitle', {
              defaultValue: 'Start tracking tasks and issues for your team',
            })}
          </p>
          {onCreateProject && (
            <Button
              onClick={onCreateProject}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>{t('projects.createProject', { defaultValue: 'Create Project' })}</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProjectsSection;
