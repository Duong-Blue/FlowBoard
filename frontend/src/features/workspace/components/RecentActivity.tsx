import { useTranslation } from 'react-i18next';
import { Activity, Loader2, Clock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ActivityUser {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
}

export interface ActivityTargetItem {
  id?: string;
  title?: string;
  key?: string;
  type?: string;
}

export interface ActivityItem {
  id: string;
  type?: string;
  user?: ActivityUser;
  actor?: ActivityUser;
  actionText?: string;
  target?: string;
  targetItem?: ActivityTargetItem | string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface RecentActivityProps {
  activities?: ActivityItem[];
  loading?: boolean;
  className?: string;
}

function getUserName(user?: ActivityUser): string {
  if (!user) return 'User';
  if (user.displayName) return user.displayName;
  if (user.name) return user.name;
  const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return full || user.email || 'User';
}

function getInitials(user?: ActivityUser): string {
  const name = getUserName(user);
  if (!name || name === 'User') return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatActionText(item: ActivityItem): string {
  if (item.actionText) return item.actionText;
  if (!item.type) return 'performed an action';

  switch (item.type) {
    case 'ISSUE_CREATED':
      return 'created issue';
    case 'TITLE_CHANGED':
      return 'updated title';
    case 'DESCRIPTION_CHANGED':
      return 'updated description';
    case 'STATUS_CHANGED':
      return 'changed status';
    case 'PRIORITY_CHANGED':
      return 'changed priority';
    case 'ASSIGNEE_CHANGED':
      return 'updated assignee';
    case 'COMMENT_CREATED':
      return 'added comment';
    case 'COMMENT_UPDATED':
      return 'updated comment';
    case 'COMMENT_DELETED':
      return 'deleted comment';
    default:
      return item.type.toLowerCase().replace(/_/g, ' ');
  }
}

function getTargetLabel(item: ActivityItem): string | null {
  if (typeof item.targetItem === 'string') return item.targetItem;
  if (item.targetItem && typeof item.targetItem === 'object') {
    const { key, title } = item.targetItem;
    if (key && title) return `${key}: ${title}`;
    if (key) return key;
    if (title) return title;
  }
  if (item.target) return item.target;
  return null;
}

export function RecentActivity({
  activities,
  loading = false,
  className,
}: RecentActivityProps) {
  const { t } = useTranslation('workspace');

  const title = t('home.activity.title', { defaultValue: 'Recent Activity' });
  const description = t('home.activity.description', {
    defaultValue: 'Latest updates and actions across your workspace',
  });
  const emptyTitle = t('home.emptyStates.noActivityTitle', {
    defaultValue: 'No Recent Activity',
  });
  const emptyDesc = t('home.emptyStates.noActivityDesc', {
    defaultValue:
      'Workspace activity log will appear here as team members perform actions.',
  });

  const hasActivities = Boolean(activities && activities.length > 0);

  return (
    <Card className={cn('overflow-hidden dark:bg-slate-900 dark:border-slate-800', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </CardTitle>
        </div>
        <CardDescription className="dark:text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-500 dark:text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : hasActivities ? (
          <div className="space-y-4">
            {activities!.map((item) => {
              const activeUser = item.user || item.actor;
              const userName = getUserName(activeUser);
              const initials = getInitials(activeUser);
              const actionText = formatActionText(item);
              const targetLabel = getTargetLabel(item);
              const timeAgo = formatRelativeTime(item.createdAt);

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {activeUser?.avatarUrl && (
                      <AvatarImage src={activeUser.avatarUrl} alt={userName} />
                    )}
                    <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="text-slate-700 dark:text-slate-400 leading-snug">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {userName}
                      </span>{' '}
                      <span>{actionText}</span>
                      {targetLabel && (
                        <>
                          {' '}
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {targetLabel}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-400 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-400 mb-3">
              <Activity className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {emptyTitle}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">{emptyDesc}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
