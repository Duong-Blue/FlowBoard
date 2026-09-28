import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/store/types';

export interface ProjectCardProps {
  project: Project;
  parentOrgName?: string;
  onClick?: () => void;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  parentOrgName,
  onClick,
  className,
}) => {
  const navigate = useNavigate();

  const orgId = project.orgId || project.organizationId || project.organization?.id || '';
  const projectKey = project.key || project.id;
  const orgName = project.organizationName || project.organization?.name || parentOrgName;
  const displayKey = (project.key || project.name.substring(0, 3)).toUpperCase();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (orgId && projectKey) {
      navigate(`/workspace/orgs/${orgId}/projects/${projectKey}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      tabIndex={0}
      role="button"
      aria-label={`Project ${project.name}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col justify-between border border-slate-200 bg-white p-5 transition-all duration-150 hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 cursor-pointer rounded-xl ${
        className || ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant="outline"
            className="bg-indigo-50/80 text-indigo-700 border-indigo-200/80 font-mono text-xs font-semibold px-2 py-0.5 rounded-md tracking-wide shrink-0"
          >
            {displayKey}
          </Badge>
          {orgName && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate max-w-[60%]">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{orgName}</span>
            </div>
          )}
        </div>

        <CardHeader className="p-0 space-y-1">
          <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {project.name}
          </CardTitle>
          {project.description && (
            <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
      </div>

      {(project.issueCount !== undefined || project._count?.issues !== undefined || project.memberCount !== undefined || project._count?.members !== undefined) && (
        <CardContent className="p-0 pt-4 mt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
          {(project.issueCount !== undefined || project._count?.issues !== undefined) && (
            <span>
              {project.issueCount ?? project._count?.issues} issues
            </span>
          )}
          {(project.memberCount !== undefined || project._count?.members !== undefined) && (
            <span>
              {project.memberCount ?? project._count?.members} members
            </span>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ProjectCard;
