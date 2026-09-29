import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
      toast.success(t('common:status.success'));
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
      toast.success((t as any)('invitations.declineSuccess') || 'Invitation declined');
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
      <div className="border border-slate-200 bg-white p-6 rounded-lg w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">{t('common:status.error')}</h2>
          <p className="mt-2 text-sm text-red-600">{error || t('invitations.noPending')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white p-6 rounded-lg w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          {t('invitations.acceptTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {t('invitations.acceptDesc')}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <Button
          onClick={handleAccept}
          disabled={accepting || declining || !token}
          className="flex-1"
          size="default"
        >
          {accepting ? t('common:buttons.submitting') : t('invitations.acceptButton')}
        </Button>
        <Button
          onClick={handleDecline}
          disabled={accepting || declining || !token}
          variant="outline"
          className="flex-1 text-slate-700 dark:text-slate-200"
          size="default"
        >
          {declining ? t('common:buttons.submitting') : (t('invitations.rejectButton') || 'Decline Invitation')}
        </Button>
      </div>
    </div>
  );
}
