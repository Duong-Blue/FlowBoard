import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MonitorSmartphone, Trash2 } from 'lucide-react';
import { api } from '@/utils/api_helper';

interface Session {
  familyId: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function SessionList() {
  const { t, i18n } = useTranslation('settings');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;
      const { data } = await api.post('/users/me/sessions/query', { refreshToken });
      setSessions(data);
    } catch (err) {
      toast.error(t('sessions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (familyId: string) => {
    try {
      await api.delete(`/users/me/sessions/${familyId}`);
      toast.success(t('sessions.revokeSuccess'));
      fetchSessions();
    } catch (err) {
      toast.error(t('sessions.revokeError'));
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!window.confirm(t('sessions.revokeAllConfirm'))) return;
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;
      await api.delete('/users/me/sessions', { data: { refreshToken } });
      toast.success(t('sessions.revokeAllSuccess'));
      fetchSessions();
    } catch (err) {
      toast.error(t('sessions.revokeAllError'));
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">{t('sessions.loading')}</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-sm text-slate-500">{t('sessions.noSessions')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {t('sessions.title')}
        </h4>
        {sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeAllOtherSessions}
            className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            {t('sessions.revokeAllOthers')}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.familyId}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-white dark:bg-slate-800 shadow-sm">
                <MonitorSmartphone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t('sessions.session')}
                  </span>
                  {session.isCurrent && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                      {t('sessions.current')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('sessions.lastUsed', { time: new Date(session.lastUsedAt).toLocaleString(i18n.language || undefined) })}
                </div>
              </div>
            </div>
            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRevokeSession(session.familyId)}
                className="text-slate-400 hover:text-red-600"
                title={t('sessions.revokeTitle')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
