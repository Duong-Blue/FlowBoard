import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyResetCode, forgotPassword } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

export default function VerifyResetCodePage() {
  const location = useLocation();
  const initialEmail = (location.state as { email?: string })?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      toast.error('Please enter email and verification code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyResetCode({ email, code });
      toast.success(t('verifyResetCode.successMessage'));
      // Keep resetToken ONLY in router location state
      navigate('/reset-password', {
        state: { email, resetToken: response.resetToken },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('verifyResetCode.invalidCode');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setIsResending(true);
    try {
      await forgotPassword({ email });
      toast.success(t('forgotPassword.successMessage'));
      setCooldown(60);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('forgotPassword.rateLimitError');
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full shadow-none border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('verifyResetCode.title')}</CardTitle>
        <CardDescription className="dark:text-slate-400">
          {t('verifyResetCode.subtitle')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('forgotPassword.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isResending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">{t('verifyResetCode.codeLabel')}</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading || isResending}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={isLoading || isResending}>
            {isLoading ? t('verifyResetCode.submittingButton') : t('verifyResetCode.submitButton')}
          </Button>
          <div className="flex items-center justify-between w-full text-sm">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending || isLoading}
            >
              {cooldown > 0
                ? t('verifyResetCode.resendCooldown', { seconds: cooldown })
                : t('verifyResetCode.resendCode')}
            </Button>
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t('verifyResetCode.backToLogin')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
