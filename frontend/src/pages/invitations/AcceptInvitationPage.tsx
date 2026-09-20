import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { acceptInvitation } from '../../services/invitationService';
import { Button } from '../../components/ui/button';

export default function AcceptInvitationPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const orgId = searchParams.get('orgId');
  
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!token || !orgId) return;
    
    try {
      setAccepting(true);
      setError(null);
      await acceptInvitation(orgId, token);
      navigate(`/workspace/orgs/${orgId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common:status.error'));
      setAccepting(false);
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

      <div className="mt-8 space-y-6">
        <Button
          onClick={handleAccept}
          disabled={accepting || !token}
          className="w-full"
          size="default"
        >
          {accepting ? t('common:buttons.submitting') : t('invitations.acceptButton')}
        </Button>
      </div>
    </div>
  );
}
