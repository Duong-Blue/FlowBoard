import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store';
import { changePassword, setPassword } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Smartphone, Laptop } from 'lucide-react';
import { updateUserLocally } from '@/store/slices/authSlice';
import { toast } from 'sonner';
import { SessionList } from './SessionList';

export function SecuritySettings() {
  const { t } = useTranslation('settings');
  const user = useAppSelector((state: any) => state.auth.user);
  const dispatch = useAppDispatch();
  
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('security.password.mismatchError'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('security.password.lengthError'));
      return;
    }

    setLoading(true);
    try {
      if (user?.hasPassword) {
        if (!currentPassword) {
          toast.error(t('security.password.currentRequiredError'));
          setLoading(false);
          return;
        }
        await changePassword({ currentPassword, newPassword });
        toast.success(t('security.password.changeSuccess'));
      } else {
        await setPassword({ newPassword });
        toast.success(t('security.password.setSuccess'));
        dispatch(updateUserLocally({ hasPassword: true }));
      }
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('security.password.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t('security.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('security.subtitle')}
        </p>
      </div>

      {/* Password Change Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('security.password.title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.hasPassword
                  ? t('security.password.hasPasswordDesc')
                  : t('security.password.noPasswordDesc')}
              </p>
            </div>
          </div>
          {!isEditingPassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingPassword(true)}
              className="text-xs border-slate-200 dark:border-slate-700"
            >
              {user?.hasPassword ? t('security.password.changeButton') : t('security.password.setButton')}
            </Button>
          )}
        </div>

        {isEditingPassword && (
          <form onSubmit={handlePasswordSubmit} className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            {user?.hasPassword && (
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="currentPassword">{t('security.password.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('security.password.currentPasswordPlaceholder')}
                />
              </div>
            )}
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="newPassword">{t('security.password.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('security.password.newPasswordPlaceholder')}
              />
            </div>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="confirmPassword">{t('security.password.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('security.password.confirmPasswordPlaceholder')}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" size="sm" disabled={loading}>
                {loading
                  ? t('security.password.saving')
                  : user?.hasPassword
                  ? t('security.password.updateButton')
                  : t('security.password.setSubmitButton')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                {t('security.password.cancelButton')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Connected Accounts */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('security.connectedAccounts.title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('security.connectedAccounts.subtitle')}
              </p>
            </div>
          </div>
        </div>
        <div className="pt-2 flex flex-wrap gap-2">
          {user?.oauthProviders?.length ? (
            user.oauthProviders.map((provider: string) => (
              <span
                key={provider}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md capitalize"
              >
                {provider}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">{t('security.connectedAccounts.none')}</span>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('security.twoFactor.title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('security.twoFactor.subtitle')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-xs border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
          >
            {t('security.twoFactor.enableButton')}
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('security.activeSessions.title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('security.activeSessions.subtitle')}
              </p>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <SessionList />
        </div>
      </div>
    </div>
  );
}
