import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Issue, WorkflowStatus } from '../../../store/types';
import { DEFAULT_CATEGORY_COLORS } from '@/hooks/useProjectWorkflow';
import { IssueCard } from './IssueCard';
import { SemanticBadge } from '../../../components/shared/SemanticBadge';

interface BoardColumnProps {
  status: WorkflowStatus;
  issues: Issue[];
  disabled?: boolean;
}

export function BoardColumn({ status, issues, disabled }: BoardColumnProps) {
  const { t } = useTranslation('issues');
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: 'Column',
      columnId: status.id,
      status,
    },
    disabled,
  });

  const statusColor =
    status.color ||
    (status.category ? DEFAULT_CATEGORY_COLORS[status.category] : undefined) ||
    '#6B7280';

  return (
    <div className="flex flex-col bg-slate-50/80 rounded-lg border border-slate-200 min-w-[300px] w-[300px] max-h-full">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-100/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          {statusColor && (
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusColor }}
            />
          )}
          <h3 className="font-semibold text-slate-700 text-sm">{status.name}</h3>
        </div>
        <SemanticBadge status="neutral">{issues.length.toString()}</SemanticBadge>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-2 overflow-y-auto flex flex-col gap-2 transition-colors ${
          isOver ? 'bg-slate-100' : ''
        }`}
      >
        <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} disabled={disabled} />
          ))}
          {issues.length === 0 && (
            <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-md text-slate-400 text-sm">
              {t('columns.dropHere')}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
