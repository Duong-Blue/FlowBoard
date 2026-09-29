import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { Mail, Calendar, Trash2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiDelete } from '@/utils/api_helper';
import { toast } from 'sonner';

export function AccountSettings() {
  const { t, i18n } = useTranslation('settings');
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(i18n.language || undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleOpenDialog = () => {
    setInputValue('');
    setIsDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const dto: Record<string, string> = {};
      if (user?.hasPassword) {
        dto.password = inputValue;
      } else {
        dto.confirmation = inputValue;
      }

      await apiDelete('/users/me', { data: dto });
      toast.success(t('account.deleteSuccess'));
      dispatch(logout());
      window.location.href = '/login';
    } catch (error: any) {
      toast.error(error.message || t('account.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const isFormValid = () => {
    if (user?.hasPassword) {
      return inputValue.length > 0;
    }
    return inputValue === 'DELETE';
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t('account.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('account.subtitle')}
        </p>
      </div>

      {/* Account Info Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('account.emailLabel')}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {user?.email || 'N/A'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="h-3 w-3" /> {t('account.verified')}
          </span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('account.memberSince')}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900 dark:text-red-300">
              {t('account.dangerZone.title')}
            </h3>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">
              {t('account.dangerZone.description')}
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenDialog}
            className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 gap-2 text-xs font-semibold"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('account.dangerZone.button')}
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> {t('account.deleteModal.title')}
            </DialogTitle>
            <DialogDescription>
              {t('account.deleteModal.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {user?.hasPassword ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('account.deleteModal.enterPasswordPrompt')}
                </p>
                <Input
                  type="password"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('account.deleteModal.passwordPlaceholder')}
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('account.deleteModal.enterDeletePrompt', { confirmText: 'DELETE' })}
                </p>
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('account.deleteModal.deletePlaceholder')}
                  autoFocus
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isDeleting}
            >
              {t('account.deleteModal.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!isFormValid() || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('account.deleteModal.deleting')}
                </>
              ) : (
                t('account.deleteModal.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

