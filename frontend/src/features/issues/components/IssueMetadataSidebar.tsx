import { type Issue, type IssueUser, type IssueType } from '@/store/types';
import { SemanticBadge } from '@/components/shared/SemanticBadge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface IssueMetadataSidebarProps {
  issue: Issue;
  members: IssueUser[];
  onUpdate: (data: Partial<Issue>) => void;
}

const TYPE_OPTIONS: IssueType[] = ['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT'];
const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_PREVIEW', 'DONE'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function formatStatus(status: string) {
  return status.replace('_', ' ');
}

export function IssueMetadataSidebar({ issue, members, onUpdate }: IssueMetadataSidebarProps) {
  const reporter = members.find(m => m.id === issue.reporterId) || issue.reporter;
  const assignee = members.find(m => m.id === issue.assigneeId) || issue.assignee;

  return (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Type</h4>
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
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</h4>
        <Select 
          value={issue.status} 
          onValueChange={(val) => onUpdate({ status: val })}
        >
          <SelectTrigger className="w-full h-8 px-2 border-transparent hover:border-border hover:bg-slate-50 justify-start">
            <SemanticBadge status={issue.status === 'TODO' ? 'pending' : issue.status === 'DONE' ? 'active' : 'member'}>
              {formatStatus(issue.status)}
            </SemanticBadge>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status} value={status}>
                <SemanticBadge status={status === 'TODO' ? 'pending' : status === 'DONE' ? 'active' : 'member'}>
                  {formatStatus(status)}
                </SemanticBadge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Priority</h4>
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
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assignee</h4>
        <Select 
          value={issue.assigneeId || 'unassigned'} 
          onValueChange={(val) => onUpdate({ assigneeId: val === 'unassigned' ? undefined : val })}
        >
          <SelectTrigger className="w-full h-10 px-2 border-transparent hover:border-border hover:bg-slate-50 justify-start space-x-2">
            {assignee ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.avatarUrl} />
                  <AvatarFallback>{assignee.displayName?.charAt(0) || assignee.firstName?.charAt(0) || assignee.email.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{assignee.displayName || assignee.firstName || assignee.email}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map(member => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{member.displayName?.charAt(0) || member.firstName?.charAt(0) || member.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{member.displayName || member.firstName || member.email}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reporter */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reporter</h4>
        <div className="flex items-center space-x-2 px-2 py-1">
          {reporter ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={reporter.avatarUrl} />
                <AvatarFallback>{reporter.displayName?.charAt(0) || reporter.firstName?.charAt(0) || reporter.email.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{reporter.displayName || reporter.firstName || reporter.email}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Unknown</span>
          )}
        </div>
      </div>

      {/* Created At */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Created</h4>
        <div className="px-2 text-sm text-foreground">
          {new Date(issue.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
