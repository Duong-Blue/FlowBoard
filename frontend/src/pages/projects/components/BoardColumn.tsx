import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Issue, IssueStatus } from '../../../store/types';
import { IssueCard } from './IssueCard';
import { SemanticBadge } from '../../../components/shared/SemanticBadge';

interface BoardColumnProps {
  id: IssueStatus;
  title: string;
  issues: Issue[];
  disabled?: boolean;
}

export function BoardColumn({ id, title, issues, disabled }: BoardColumnProps) {
  const { t } = useTranslation('issues');
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      columnId: id,
    },
    disabled,
  });

  return (
    <div className="flex flex-col bg-slate-50/80 rounded-lg border border-slate-200 min-w-[300px] w-[300px] max-h-full">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-100/50 rounded-t-lg">
        <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
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
