import { type IssueActivity } from '../../../services/issueService';
import { 
  FilePlus, 
  Type, 
  AlignLeft, 
  ArrowRightCircle, 
  AlertCircle, 
  User, 
  MessageSquare,
  Edit2,
  Trash2
} from 'lucide-react';

interface ActivityItemProps {
  activity: IssueActivity;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'ISSUE_CREATED': return <FilePlus className="h-4 w-4 text-emerald-500" />;
    case 'TITLE_CHANGED': return <Type className="h-4 w-4 text-blue-500" />;
    case 'DESCRIPTION_CHANGED': return <AlignLeft className="h-4 w-4 text-blue-500" />;
    case 'STATUS_CHANGED': return <ArrowRightCircle className="h-4 w-4 text-indigo-500" />;
    case 'PRIORITY_CHANGED': return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'ASSIGNEE_CHANGED': return <User className="h-4 w-4 text-purple-500" />;
    case 'COMMENT_CREATED': return <MessageSquare className="h-4 w-4 text-slate-500" />;
    case 'COMMENT_UPDATED': return <Edit2 className="h-4 w-4 text-slate-500" />;
    case 'COMMENT_DELETED': return <Trash2 className="h-4 w-4 text-rose-500" />;
    default: return <AlertCircle className="h-4 w-4 text-slate-400" />;
  }
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const actorName = activity.actor 
    ? (activity.actor.displayName || `${activity.actor.firstName} ${activity.actor.lastName}`.trim()) 
    : 'Deleted User';
  
  const renderMessage = () => {
    switch (activity.type) {
      case 'ISSUE_CREATED':
        return <span>created this issue</span>;
      case 'TITLE_CHANGED':
        return <span>changed title from <strong>{activity.metadata.from}</strong> to <strong>{activity.metadata.to}</strong></span>;
      case 'DESCRIPTION_CHANGED':
        return <span>updated the description</span>;
      case 'STATUS_CHANGED':
        return <span>changed status from <strong>{activity.metadata.from}</strong> to <strong>{activity.metadata.to}</strong></span>;
      case 'PRIORITY_CHANGED':
        return <span>changed priority from <strong>{activity.metadata.from}</strong> to <strong>{activity.metadata.to}</strong></span>;
      case 'ASSIGNEE_CHANGED':
        return activity.metadata.toName 
          ? <span>assigned issue to <strong>{activity.metadata.toName}</strong></span>
          : <span>unassigned issue</span>;
      case 'COMMENT_CREATED':
        return <span>added a comment</span>;
      case 'COMMENT_UPDATED':
        return <span>edited a comment</span>;
      case 'COMMENT_DELETED':
        return <span>deleted a comment</span>;
      default:
        return <span>performed an action</span>;
    }
  };

  const date = new Date(activity.createdAt);
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);

  return (
    <div className="flex gap-3 text-sm">
      <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 ring-4 ring-white z-10">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex flex-col py-1">
        <div className="text-slate-600">
          <span className="font-medium text-slate-900">{actorName}</span>{' '}
          {renderMessage()}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">{formattedDate}</div>
      </div>
    </div>
  );
}
