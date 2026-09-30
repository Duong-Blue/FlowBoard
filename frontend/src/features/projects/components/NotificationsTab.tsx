import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Mail, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NotificationsTabProps {
  projectId?: string;
  isAdmin?: boolean;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ projectId, isAdmin = true }) => {
  const { t } = useTranslation(['workspace', 'common']);

  const storageKey = `project_notifications_${projectId || 'default'}`;
  
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback to defaults
    }
    return {
      emailOnIssueCreated: true,
      emailOnStatusChange: true,
      emailOnMemberAdded: true,
      emailOnComment: true,
      weeklyDigest: false,
    };
  });

  const [saving, setSaving] = useState(false);

  const togglePref = (key: keyof typeof preferences) => {
    if (!isAdmin) return;
    setPreferences((prev: typeof preferences) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      localStorage.setItem(storageKey, JSON.stringify(preferences));
      toast.success(t('projects.notificationsSaveSuccess', { defaultValue: 'Notification preferences saved.' }));
    } catch (err) {
      console.error('Failed to save preferences:', err);
      toast.error(t('common:status.error'));
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      key: 'emailOnIssueCreated' as const,
      title: t('projects.notifications.issueCreatedTitle', { defaultValue: 'New Issue Notifications' }),
      desc: t('projects.notifications.issueCreatedDesc', { defaultValue: 'Receive email alerts when a new issue is created in this project.' }),
    },
    {
      key: 'emailOnStatusChange' as const,
      title: t('projects.notifications.statusChangeTitle', { defaultValue: 'Status Updates' }),
      desc: t('projects.notifications.statusChangeDesc', { defaultValue: 'Receive email alerts when issue status transitions occur.' }),
    },
    {
      key: 'emailOnComment' as const,
      title: t('projects.notifications.commentsTitle', { defaultValue: 'Comments & Activity' }),
      desc: t('projects.notifications.commentsDesc', { defaultValue: 'Receive email alerts when comments are added to your assigned issues.' }),
    },
    {
      key: 'emailOnMemberAdded' as const,
      title: t('projects.notifications.memberTitle', { defaultValue: 'Member Changes' }),
      desc: t('projects.notifications.memberDesc', { defaultValue: 'Notify when team members are added or removed from this project.' }),
    },
    {
      key: 'weeklyDigest' as const,
      title: t('projects.notifications.digestTitle', { defaultValue: 'Weekly Activity Digest' }),
      desc: t('projects.notifications.digestDesc', { defaultValue: 'Receive a weekly summary email detailing overall project progress.' }),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {t('projects.notificationsTitle', { defaultValue: 'Notification Preferences' })}
            </CardTitle>
          </div>
          <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
            {t('projects.notificationsSubtitle', { defaultValue: 'Configure email and alert settings for this project.' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            {items.map((item) => {
              const isChecked = preferences[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChecked}
                    aria-label={item.title}
                    onClick={() => togglePref(item.key)}
                    disabled={!isAdmin}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isChecked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
        {isAdmin && (
          <CardFooter className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? t('projects.saving', { defaultValue: 'Saving...' }) : t('projects.saveChanges', { defaultValue: 'Save Changes' })}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default NotificationsTab;
