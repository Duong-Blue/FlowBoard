import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { apiPost } from '../../utils/api_helper';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { type User } from '../../store/types';

interface ExchangeResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  returnTo?: string;
}

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation('auth');

  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const emailParam = searchParams.get('email');

  const getInitialError = () => {
    if (!errorParam) {
      if (!code) return t('oauth.invalidState');
      return null;
    }
    if (errorParam === 'account_conflict') {
      return t('oauth.accountConflictDesc', { email: emailParam || '' });
    }
    if (errorParam === 'invalid_state') {
      return t('oauth.invalidState');
    }
    if (errorParam === 'cancel') {
      return t('oauth.cancel');
    }
    return t('oauth.genericError');
  };

  const [isLoading, setIsLoading] = useState<boolean>(!errorParam && !!code);
  const [errorMessage, setErrorMessage] = useState<string | null>(getInitialError);

  const exchangeExecutedRef = useRef(false);

  useEffect(() => {
    if (errorParam || !code) {
      return;
    }

    if (exchangeExecutedRef.current) {
      return;
    }
    exchangeExecutedRef.current = true;

    async function performExchange() {
      try {
        const response = await apiPost<ExchangeResponse>('/auth/oauth/exchange', { code });
        dispatch(
          setCredentials({
            user: response.user,
            accessToken: response.accessToken,
          }),
        );
        localStorage.setItem('refreshToken', response.refreshToken);
        toast.success(t('oauth.loginSuccess'));
        const destination = response.returnTo || '/workspace';
        navigate(destination, { replace: true });
      } catch (error: unknown) {
        setIsLoading(false);
        const msg = error instanceof Error ? error.message : t('oauth.genericError');
        setErrorMessage(msg);
      }
    }

    performExchange();
  }, [code, errorParam, dispatch, navigate, t]);

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <Card className="w-full shadow-none border border-slate-200 bg-white">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          {isLoading ? (
            t('oauth.loading')
          ) : errorParam === 'account_conflict' ? (
            <span className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-6 w-6" />
              {t('oauth.accountConflictTitle')}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              {t('oauth.errorTitle')}
            </span>
          )}
        </CardTitle>
        {errorMessage && <CardDescription className="text-center text-sm pt-2">{errorMessage}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('oauth.loading')}</p>
          </div>
        )}
      </CardContent>
      {!isLoading && (
        <CardFooter className="flex justify-center">
          <Button onClick={handleBackToLogin} className="w-full">
            {t('oauth.backToLogin')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
