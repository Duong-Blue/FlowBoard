import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../store/slices/notificationSlice';
import type { NotificationItem, NotificationActor } from '../../store/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn } from '../../lib/utils';

function getActorName(actor?: NotificationActor | null): string {
  if (!actor) return 'System';
  if (actor.displayName) return actor.displayName;
  const full = `${actor.firstName || ''} ${actor.lastName || ''}`.trim();
  return full || 'User';
}

function getInitials(actor?: NotificationActor | null): string {
  if (!actor) return '?';
  const name = getActorName(actor);
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

export function NotificationCenter() {
  const { t } = useTranslation(['workspace', 'common']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { items, unreadCount, loading } = useAppSelector((state) => state.notification);
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const projects = useAppSelector((state) => state.project.list);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 20 }));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      dispatch(markNotificationAsRead(item.id));
    }
    setOpen(false);

    if (item.projectId && item.issueId) {
      const targetOrgId = item.organizationId || activeOrgId;
      const foundProject = projects.find((p) => p.id === item.projectId || p.key === item.project?.key);
      const targetProjectKey = item.project?.key || foundProject?.key;

      if (targetOrgId && targetProjectKey) {
        navigate(`/workspace/orgs/${targetOrgId}/projects/${targetProjectKey}/issues/${item.issueId}`);
      } else {
        navigate(`/projects/${item.projectId}/issues/${item.issueId}`);
      }
    } else if (item.projectId) {
      const targetOrgId = item.organizationId || activeOrgId;
      const foundProject = projects.find((p) => p.id === item.projectId || p.key === item.project?.key);
      const targetProjectKey = item.project?.key || foundProject?.key;

      if (targetOrgId && targetProjectKey) {
        navigate(`/workspace/orgs/${targetOrgId}/projects/${targetProjectKey}`);
      } else {
        navigate(`/projects/${item.projectId}`);
      }
    }
  };

  const displayUnread = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 cursor-pointer"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
              {displayUnread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] max-w-[calc(100vw-2rem)] p-0 shadow-lg border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t('sidebar.activity')}</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer"
            >
              <CheckCheck size={14} />
              {t('common:buttons.confirm')}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loading && items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400 dark:text-slate-500" />
              <span>{t('common:status.loading')}</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-2">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('common:emptyState.noData')}</span>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex items-start gap-3 p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60',
                  !item.isRead && 'bg-blue-50/40 dark:bg-slate-800/30'
                )}
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                  {item.actor?.avatarUrl && (
                    <AvatarImage src={item.actor.avatarUrl} alt={getActorName(item.actor)} />
                  )}
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
                    {getInitials(item.actor)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.title || 'Notification'}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  {item.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 break-words">
                      {item.message}
                    </p>
                  )}
                </div>

                {/* Unread indicator */}
                {!item.isRead && (
                  <span
                    className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0 mt-1.5"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
