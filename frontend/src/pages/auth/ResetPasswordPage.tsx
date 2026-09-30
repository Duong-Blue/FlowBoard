import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const location = useLocation();
  const resetToken = (location.state as { resetToken?: string })?.resetToken;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (!resetToken) {
      toast.error(t('verifyResetCode.codeExpired'));
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetToken) {
      toast.error(t('verifyResetCode.codeExpired'));
      navigate('/forgot-password', { replace: true });
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('resetPassword.minPasswordLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('resetPassword.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ resetToken, newPassword });
      toast.success(t('resetPassword.successMessage'));
      navigate('/reset-success', { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetToken) {
    return null;
  }

  return (
    <Card className="w-full shadow-none border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('resetPassword.title')}</CardTitle>
        <CardDescription className="dark:text-slate-400">
          {t('resetPassword.subtitle')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('resetPassword.newPasswordLabel')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('resetPassword.confirmPasswordLabel')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? t('resetPassword.submittingButton') : t('resetPassword.submitButton')}
          </Button>
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
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
