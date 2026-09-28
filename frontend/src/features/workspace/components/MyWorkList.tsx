import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bug,
  CheckSquare,
  Bookmark,
  Layers,
  FileText,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { SemanticBadge } from '@/components/shared/SemanticBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, getDeadlineState } from '@/lib/dateUtils';
import { useAppSelector } from '@/store';
import type { Issue } from '@/store/types';
import { cn } from '@/lib/utils';

export interface MyWorkListProps {
  issues?: Issue[];
  loading?: boolean;
  onIssueClick?: (issue: Issue) => void;
  className?: string;
  title?: string;
  description?: string;
}

export function getIssueTypeIcon(type?: string) {
  const normalized = (type || '').toUpperCase();
  switch (normalized) {
    case 'BUG':
      return <Bug className="h-4 w-4 text-rose-500 shrink-0" />;
    case 'TASK':
      return <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />;
    case 'STORY':
    case 'FEATURE':
      return <Bookmark className="h-4 w-4 text-emerald-500 shrink-0" />;
    case 'EPIC':
    case 'IMPROVEMENT':
      return <Layers className="h-4 w-4 text-purple-500 shrink-0" />;
    default:
      return <FileText className="h-4 w-4 text-slate-400 shrink-0" />;
  }
}

export function MyWorkListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 animate-pulse"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-5 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MyWorkList({
  issues = [],
  loading = false,
  onIssueClick,
  className,
  title,
  description,
}: MyWorkListProps) {
  const { t } = useTranslation(['workspace', 'issues', 'common']);
  const navigate = useNavigate();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  if (loading) {
    return <MyWorkListSkeleton />;
  }

  if (!issues || issues.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title={
          title ||
          t('home.emptyStates.noWorkTitle', {
            defaultValue: t('home.myWork.title', { defaultValue: 'No assigned work' }),
          })
        }
        description={
          description ||
          t('home.emptyStates.noWorkDesc', {
            defaultValue: 'You have no assigned tasks or pending issues at the moment.',
          })
        }
        className={cn('py-12 bg-white dark:bg-slate-900', className)}
      />
    );
  }

  const getIssuePath = (issue: Issue) => {
    const targetOrgId =
      issue.orgId ||
      issue.project?.organizationId ||
      issue.project?.orgId ||
      activeOrgId ||
      'default';
    const targetProjectKey =
      issue.projectKey ||
      issue.project?.key ||
      (issue.key ? issue.key.split('-')[0] : 'PROJ');
    const issueKey = issue.key || issue.id;
    return `/workspace/orgs/${targetOrgId}/projects/${targetProjectKey}/issues/${issueKey}`;
  };

  const renderStatusBadge = (issue: Issue) => {
    const statusName = issue.workflowStatus?.name || issue.status || 'TODO';
    const category = (issue.workflowStatus?.category || issue.status || '').toUpperCase();

    let statusStyle = 'guest';
    if (category === 'DONE' || category === 'COMPLETED') {
      statusStyle = 'active';
    } else if (category === 'IN_PROGRESS' || category === 'IN_PREVIEW') {
      statusStyle = 'pending';
    }

    return (
      <SemanticBadge status={statusStyle} className="text-[11px] px-2 py-0.5">
        {statusName}
      </SemanticBadge>
    );
  };

  const renderPriorityBadge = (issue: Issue) => {
    const priority = (issue.priority || 'MEDIUM').toUpperCase();
    let priorityStyle = 'member';
    if (priority === 'HIGH' || priority === 'URGENT' || priority === 'CRITICAL') {
      priorityStyle = 'admin';
    } else if (priority === 'LOW') {
      priorityStyle = 'guest';
    }

    const translatedPriority = t(`issues:priorities.${priority.toLowerCase()}`, {
      defaultValue: issue.priority || 'Medium',
    });

    return (
      <SemanticBadge status={priorityStyle} className="text-[11px] px-2 py-0.5 capitalize">
        {translatedPriority}
      </SemanticBadge>
    );
  };

  const renderDueDate = (issue: Issue) => {
    if (!issue.dueDate) return null;

    const deadlineState =
      issue.deadlineState || getDeadlineState(issue.status, issue.dueDate, issue.completedAt);

    let badgeStyle =
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';

    if (deadlineState === 'OVERDUE') {
      badgeStyle =
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    } else if (deadlineState === 'DUE_SOON') {
      badgeStyle =
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    }

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium shrink-0',
          badgeStyle,
        )}
      >
        <Calendar className="h-3 w-3" />
        <span>{formatDate(issue.dueDate)}</span>
      </span>
    );
  };

  return (
    <div className={cn('space-y-2.5', className)}>
      {issues.map((issue) => {
        const path = getIssuePath(issue);
        const projectKey =
          issue.projectKey ||
          issue.project?.key ||
          (issue.key ? issue.key.split('-')[0] : null);
        const projectName = issue.projectName || issue.project?.name;

        const handleClick = (e: React.MouseEvent) => {
          if (onIssueClick) {
            e.preventDefault();
            onIssueClick(issue);
          } else {
            navigate(path);
          }
        };

        return (
          <Link
            key={issue.id}
            to={path}
            onClick={handleClick}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {getIssueTypeIcon(issue.type)}

              {issue.key && (
                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {issue.key}
                </span>
              )}

              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {issue.title}
              </h4>

              {(projectKey || projectName) && (
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shrink-0">
                  {projectKey || projectName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              {renderStatusBadge(issue)}
              {renderPriorityBadge(issue)}
              {renderDueDate(issue)}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default MyWorkList;
