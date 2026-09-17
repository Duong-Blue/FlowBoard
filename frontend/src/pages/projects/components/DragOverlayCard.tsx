import type { Issue } from '../../../store/types';
import { SemanticBadge } from '../../../components/shared/SemanticBadge';

interface DragOverlayCardProps {
  issue: Issue;
}

export function DragOverlayCard({ issue }: DragOverlayCardProps) {
  return (
    <div className="bg-white p-3 rounded-md shadow-lg border-2 border-primary/20 cursor-grabbing rotate-2 scale-105">
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
