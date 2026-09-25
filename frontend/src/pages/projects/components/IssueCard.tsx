import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import type { Issue } from '../../../store/types';
import { SemanticBadge } from '../../../components/shared/SemanticBadge';
import { getDeadlineState, formatDate } from '@/lib/dateUtils';
import { useProjectWorkflow } from '@/hooks/useProjectWorkflow';
import { Calendar, CheckSquare } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  disabled?: boolean;
}

export function IssueCard({ issue, disabled }: IssueCardProps) {
  const { orgId, projectKey, projectId } = useParams<{ orgId?: string; projectKey?: string; projectId?: string }>();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const projectList = useAppSelector((state) => state.project.list);
  const navigate = useNavigate();
  const { getStatusById, getStatusColor } = useProjectWorkflow(issue.projectId || projectId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: {
      type: 'Issue',
      issue,
    },
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-slate-100 rounded-md p-3 border-2 border-dashed border-slate-300 h-24"
      />
    );
  }

  const handleClick = () => {
    if (isDragging) return;
    const targetOrgId = orgId || activeOrgId;
    const foundProject = projectList.find((p) => p.id === projectId || p.key === projectKey || p.id === issue.projectId);
    const targetProjectKey = projectKey || foundProject?.key;
    const issueKey = issue.key || issue.id;
    if (targetOrgId && targetProjectKey) {
      navigate(`/workspace/orgs/${targetOrgId}/projects/${targetProjectKey}/issues/${issueKey}`);
    }
  };

  const statusObj = issue.workflowStatus || getStatusById(issue.workflowStatusId) || getStatusById(issue.status);
  const statusName = statusObj?.name || issue.status;
  const statusColor = getStatusColor(issue.workflowStatusId || issue.status);

  const deadlineState = issue.deadlineState || getDeadlineState(issue.status, issue.dueDate, issue.completedAt);

  let deadlineBadgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
  if (deadlineState === 'OVERDUE') {
    deadlineBadgeStyle = 'bg-red-50 text-red-700 border-red-200';
  } else if (deadlineState === 'DUE_SOON') {
    deadlineBadgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (deadlineState === 'UPCOMING' || deadlineState === 'COMPLETED') {
    deadlineBadgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  const totalSubtasks = issue.subtaskMetrics?.total ?? issue.subtasks?.length ?? 0;
  const completedSubtasks = issue.subtaskMetrics?.completed ?? issue.subtasks?.filter((st) => {
    if (st.workflowStatusId) {
      const stWf = getStatusById(st.workflowStatusId);
      if (stWf) return stWf.category === 'DONE';
    }
    if (st.workflowStatus?.category) return st.workflowStatus.category === 'DONE';
    return st.status === 'DONE' || st.status === 'COMPLETED';
  }).length ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`bg-white p-3 rounded-md shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-slate-300 transition-colors ${disabled ? 'cursor-default active:cursor-default' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {issue.key && (
            <span className="text-xs font-mono font-semibold text-slate-500">{issue.key}</span>
          )}
          {statusName && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
              style={{
                backgroundColor: `${statusColor}20`,
                color: statusColor,
                borderColor: `${statusColor}40`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
              <span>{statusName}</span>
            </span>
          )}
        </div>
        <SemanticBadge status={
          issue.priority === 'HIGH' ? 'admin' :
          issue.priority === 'MEDIUM' ? 'member' : 'guest'
        }>
          {issue.priority}
        </SemanticBadge>
      </div>
      <p className="text-sm font-medium text-slate-900 mb-3">{issue.title}</p>
      {(issue.dueDate || totalSubtasks > 0) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {issue.dueDate && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${deadlineBadgeStyle}`}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(issue.dueDate)}</span>
            </span>
          )}
          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <CheckSquare className="w-3 h-3 text-slate-500" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </span>
          )}
        </div>
      )}
      <div className="flex justify-between items-center text-xs text-slate-500">
        <div className="truncate flex-1">
          {issue.assignee ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                {(issue.assignee.displayName?.[0] || issue.assignee.email[0]).toUpperCase()}
              </div>
              <span className="truncate">{issue.assignee.displayName || issue.assignee.email}</span>
            </div>
          ) : (
            <span>Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
}
