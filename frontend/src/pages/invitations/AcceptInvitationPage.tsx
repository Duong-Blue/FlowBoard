import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  UserCheck,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { acceptInvitation, declineInvitation } from '../../services/invitationService';
import { Button } from '../../components/ui/button';
import { useAppSelector } from '../../store';
import { toast } from 'sonner';

export default function AcceptInvitationPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = searchParams.get('token');
  const orgId = searchParams.get('orgId');

  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);

  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, currentUser, navigate, location]);

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const handleAccept = async () => {
    if (!token || !orgId) return;

    try {
      setAccepting(true);
      setError(null);
      await acceptInvitation(orgId, token);
      toast.success(t('invitations.acceptSuccess'));
      navigate(`/workspace/orgs/${orgId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common:status.error');
      setError(message);
      toast.error(message);
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!token || !orgId) return;

    try {
      setDeclining(true);
      setError(null);
      await declineInvitation(orgId, token);
      toast.success(t('invitations.declineSuccess'));
      navigate('/workspace');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common:status.error');
      setError(message);
      toast.error(message);
      setDeclining(false);
    }
  };

  if (!token || !orgId) {
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('invitations.invalidTokenTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t('invitations.invalidTokenDesc')}
          </p>
          <div className="mt-6 w-full">
            <Button
              onClick={() => navigate('/workspace')}
              className="w-full"
              variant="default"
            >
              {t('invitations.goWorkspace')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isSubmitting = accepting || declining;

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-center text-center">
        {/* Header Icon */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
          <Building2 className="h-8 w-8" />
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('invitations.acceptTitle')}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('invitations.acceptDesc')}
        </p>

        {/* Current User Info Card */}
        <div className="mt-6 flex w-full flex-col gap-2 rounded-xl bg-slate-50 p-4 text-left dark:bg-slate-800/60 dark:border dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <UserCheck className="h-4 w-4 text-blue-500" />
            <span>{t('invitations.loggedInAs')}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {currentUser.displayName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {currentUser.email}
              </p>
            </div>
            <Link
              to="/login"
              state={{ from: location }}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              title={t('invitations.switchAccount')}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t('invitations.switchAccount')}</span>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex w-full items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="flex-1 text-xs font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex w-full flex-col gap-3">
          <Button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="w-full gap-2 bg-blue-600 font-semibold hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            size="lg"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('common:buttons.submitting')}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('invitations.acceptButton')}</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-70" />
              </>
            )}
          </Button>

          <Button
            onClick={handleDecline}
            disabled={isSubmitting}
            variant="outline"
            className="w-full gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            size="lg"
          >
            {declining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('common:buttons.submitting')}</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-slate-400" />
                <span>{t('invitations.rejectButton')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
