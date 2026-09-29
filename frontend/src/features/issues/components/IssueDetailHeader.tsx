import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash2, Calendar, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { formatDate, formatDateTime, calculateDurationInDays } from '@/lib/dateUtils';

interface IssueDetailHeaderProps {
  issueKey: string;
  startDate?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function IssueDetailHeader({
  issueKey,
  startDate,
  dueDate,
  createdAt,
  updatedAt,
  canDelete = false,
  onDelete,
}: IssueDetailHeaderProps) {
  const navigate = useNavigate();
  const { orgId, projectKey } = useParams<{ orgId?: string; projectKey?: string }>();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  const handleBack = () => {
    const targetOrgId = orgId || activeOrgId;

    if (targetOrgId && projectKey) {
      navigate(`/workspace/orgs/${targetOrgId}/projects/${projectKey}/issues`);
    }
  };

  const durationDays = calculateDurationInDays(startDate, dueDate);

  return (
    <div className="flex flex-wrap items-center justify-between py-4 border-b border-border dark:border-slate-800 gap-2">
      <div className="flex items-center space-x-3 flex-wrap gap-y-1">
        <Button variant="ghost" size="icon" onClick={handleBack} className="text-muted-foreground dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Back to Board</span>
        </Button>
        <div className="text-sm font-semibold text-foreground dark:text-slate-400 font-mono">
          {issueKey}
        </div>

        {/* Date Range Badge */}
        {(startDate || dueDate) && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {startDate ? formatDate(startDate) : 'N/A'} → {dueDate ? formatDate(dueDate) : 'N/A'}
            </span>
            {durationDays !== null && (
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                {durationDays} ngày
              </span>
            )}
          </div>
        )}

        {/* Created / Updated Time */}
        {createdAt && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Tạo: {formatDateTime(createdAt)}</span>
            {updatedAt && updatedAt !== createdAt && (
              <span>• Cập nhật: {formatDateTime(updatedAt)}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {canDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Issue
          </Button>
        )}
      </div>
    </div>
  );
}
