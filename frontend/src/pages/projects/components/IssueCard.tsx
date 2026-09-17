import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import type { Issue } from '../../../store/types';
import { SemanticBadge } from '../../../components/shared/SemanticBadge';

interface IssueCardProps {
  issue: Issue;
  disabled?: boolean;
}

export function IssueCard({ issue, disabled }: IssueCardProps) {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const navigate = useNavigate();
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
    const targetProjectId = projectId || issue.projectId;
    const issueKey = issue.key || issue.id;
    if (targetOrgId && targetProjectId) {
      navigate(`/orgs/${targetOrgId}/projects/${targetProjectId}/issues/${issueKey}`);
    } else if (targetProjectId) {
      navigate(`/projects/${targetProjectId}/issues/${issueKey}`);
    }
  };

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
        <span className="text-xs font-mono font-semibold text-slate-500">{issue.key}</span>
        <SemanticBadge status={
          issue.priority === 'HIGH' ? 'admin' :
          issue.priority === 'MEDIUM' ? 'member' : 'guest'
        }>
          {issue.priority}
        </SemanticBadge>
      </div>
      <p className="text-sm font-medium text-slate-900 mb-3">{issue.title}</p>
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
