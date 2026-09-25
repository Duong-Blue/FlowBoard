import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Issue, type IssueUser, type IssueType, type DeadlineState } from '@/store/types';
import { SemanticBadge } from '@/components/shared/SemanticBadge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, getDeadlineState } from '@/lib/dateUtils';
import { useProjectWorkflow } from '@/hooks/useProjectWorkflow';

interface IssueMetadataSidebarProps {
  issue: Issue;
  members: IssueUser[];
  onUpdate: (data: Partial<Issue>) => void;
  onStatusChange?: (status: string, workflowStatusId?: string) => void;
}

const TYPE_OPTIONS: IssueType[] = ['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT'];
const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_PREVIEW', 'DONE'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const toInputDate = (isoString?: string | null) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const getDeadlineBadgeStatus = (state: DeadlineState) => {
  switch (state) {
    case 'OVERDUE': return 'destructive';
    case 'DUE_SOON': return 'pending';
    case 'COMPLETED': return 'active';
    case 'UPCOMING': return 'member';
    default: return 'guest';
  }
};

export function IssueMetadataSidebar({ issue, members, onUpdate, onStatusChange }: IssueMetadataSidebarProps) {
  const { t } = useTranslation(['issues', 'common']);
  const { statuses, getStatusById, getStatusColor, getAllowedTransitions } = useProjectWorkflow(issue.projectId);

  const reporter = members.find(m => m.id === issue.reporterId) || issue.reporter;
  const assignee = members.find(m => m.id === issue.assigneeId) || issue.assignee;
  const deadlineState = issue.deadlineState || getDeadlineState(issue.status, issue.dueDate, issue.completedAt);

  const currentWfStatus = getStatusById(issue.workflowStatusId) || getStatusById(issue.status);
  const currentStatusId = currentWfStatus?.id || issue.workflowStatusId || issue.status;

  const allowedTransitions = useMemo(() => {
    return getAllowedTransitions(currentStatusId);
  }, [getAllowedTransitions, currentStatusId]);

  const transitionOptions = useMemo(() => {
    if (statuses.length === 0) return [];
    if (allowedTransitions.length === 0) return statuses;
    const hasCurrent = allowedTransitions.some((s) => s.id === currentStatusId);
    if (!hasCurrent && currentWfStatus) {
      return [currentWfStatus, ...allowedTransitions];
    }
    return allowedTransitions;
  }, [statuses, allowedTransitions, currentStatusId, currentWfStatus]);

  const activeStatusObj = currentWfStatus || getStatusById(currentStatusId);
  const activeStatusName = activeStatusObj?.name || issue.status;
  const activeStatusColor = getStatusColor(currentStatusId);

  return (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('form.typeLabel')}</h4>
        <Select 
          value={issue.type || 'TASK'} 
          onValueChange={(val) => onUpdate({ type: val as IssueType })}
        >
          <SelectTrigger className="w-full h-8 px-2 border-transparent hover:border-border hover:bg-slate-50 justify-start">
            <SemanticBadge status={issue.type === 'BUG' ? 'destructive' : issue.type === 'FEATURE' ? 'active' : issue.type === 'IMPROVEMENT' ? 'member' : 'pending'}>
              {issue.type || 'TASK'}
            </SemanticBadge>
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map(type => (
              <SelectItem key={type} value={type}>
                <SemanticBadge status={type === 'BUG' ? 'destructive' : type === 'FEATURE' ? 'active' : type === 'IMPROVEMENT' ? 'member' : 'pending'}>
                  {type}
                </SemanticBadge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('detail.status')}</h4>
        <Select 
          value={currentStatusId} 
          onValueChange={(val) => {
            const selectedWfStatus = getStatusById(val) || statuses.find((s) => s.id === val || s.category === val);
            const targetCategory = selectedWfStatus?.category || selectedWfStatus?.name || val;
            const targetWfId = selectedWfStatus?.id || val;

            if (onStatusChange) {
              onStatusChange(targetCategory, targetWfId);
            } else {
              onUpdate({ status: targetCategory, workflowStatusId: targetWfId });
            }
          }}
        >
          <SelectTrigger className="w-full h-8 px-2 border-transparent hover:border-border hover:bg-slate-50 justify-start">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${activeStatusColor}20`,
                color: activeStatusColor,
                borderColor: `${activeStatusColor}40`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeStatusColor }} />
              <span>{activeStatusName}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            {transitionOptions.length > 0 ? (
              transitionOptions.map((st) => {
                const color = st.color || getStatusColor(st.id);
                return (
                  <SelectItem key={st.id} value={st.id}>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                        borderColor: `${color}40`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span>{st.name}</span>
                    </span>
                  </SelectItem>
                );
              })
            ) : (
              STATUS_OPTIONS.map(status => (
                <SelectItem key={status} value={status}>
                  <SemanticBadge status={status === 'TODO' ? 'pending' : status === 'DONE' ? 'active' : 'member'}>
                    {status}
                  </SemanticBadge>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('detail.priority')}</h4>
        <Select 
          value={issue.priority} 
          onValueChange={(val) => onUpdate({ priority: val })}
        >
          <SelectTrigger className="w-full h-8 px-2 border-transparent hover:border-border hover:bg-slate-50 justify-start">
            <SemanticBadge status={issue.priority === 'URGENT' || issue.priority === 'HIGH' ? 'destructive' : 'pending'}>
              {issue.priority}
            </SemanticBadge>
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(priority => (
              <SelectItem key={priority} value={priority}>
                <SemanticBadge status={priority === 'URGENT' || priority === 'HIGH' ? 'destructive' : 'pending'}>
                  {priority}
                </SemanticBadge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('detail.assignee')}</h4>
        <Select 
          value={issue.assigneeId || 'unassigned'} 
          onValueChange={(val) => onUpdate({ assigneeId: val === 'unassigned' ? undefined : val })}
        >
          <SelectTrigger className="w-full h-10 px-2 border-transparent hover:border-border hover:bg-slate-50 justify-start space-x-2">
            {assignee ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.avatarUrl} />
                  <AvatarFallback>{(assignee.displayName?.charAt(0) || assignee.firstName?.charAt(0) || assignee.email?.charAt(0)) ?? ' ?'}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{(assignee.displayName || assignee.firstName || assignee.email) ?? ' ?'}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{t('form.unassigned')}</span>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">{t('form.unassigned')}</SelectItem>
            {members.map(member => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{(member.displayName?.charAt(0) || member.firstName?.charAt(0) || member.email?.charAt(0)) ?? ' ?'}</AvatarFallback>
                  </Avatar>
                  <span>{(member.displayName || member.firstName || member.email) ?? ' ?'}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reporter */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('detail.reporter')}</h4>
        <div className="flex items-center space-x-2 px-2 py-1">
          {reporter ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={reporter.avatarUrl} />
                <AvatarFallback>{(reporter.displayName?.charAt(0) || reporter.firstName?.charAt(0) || reporter.email?.charAt(0)) ?? ' ?'}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{(reporter.displayName || reporter.firstName || reporter.email) ?? ' ?'}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{t('form.unassigned')}</span>
          )}
        </div>
      </div>

      {/* Dates Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('detail.dates', 'Dates')}</h4>
        
        {/* Start Date */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">{t('detail.startDate', 'Start Date')}</label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={toInputDate(issue.startDate)}
              onChange={(e) => {
                const val = e.target.value;
                onUpdate({ startDate: val ? new Date(val).toISOString() : (null as any) });
              }}
              className="text-xs border border-input rounded px-2 py-1 bg-background hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {issue.startDate && (
              <span className="text-xs text-muted-foreground">
                {formatDate(issue.startDate)}
              </span>
            )}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">{t('detail.dueDate', 'Due Date')}</label>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <input
              type="date"
              value={toInputDate(issue.dueDate)}
              onChange={(e) => {
                const val = e.target.value;
                onUpdate({ dueDate: val ? new Date(val).toISOString() : (null as any) });
              }}
              className="text-xs border border-input rounded px-2 py-1 bg-background hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {issue.dueDate && (
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-muted-foreground">
                  {formatDate(issue.dueDate)}
                </span>
                <SemanticBadge status={getDeadlineBadgeStatus(deadlineState)}>
                  {deadlineState}
                </SemanticBadge>
              </div>
            )}
          </div>
        </div>

        {/* Completed At (Read-only) */}
        {issue.completedAt && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">{t('detail.completedAt', 'Completed At')}</label>
            <div className="text-xs text-foreground px-2 py-1 bg-slate-50 rounded border border-slate-100">
              {formatDate(issue.completedAt)}
            </div>
          </div>
        )}
      </div>

      {/* Created At */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('common:labels.created')}</h4>
        <div className="px-2 text-sm text-foreground">
          {new Date(issue.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
