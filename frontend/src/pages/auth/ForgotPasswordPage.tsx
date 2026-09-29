import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword({ email });
      toast.success(t('forgotPassword.successMessage'));
      navigate('/verify-reset-code', { state: { email } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('forgotPassword.rateLimitError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-none border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('forgotPassword.title')}</CardTitle>
        <CardDescription className="dark:text-slate-400">
          {t('forgotPassword.subtitle')}
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
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? t('forgotPassword.submittingButton') : t('forgotPassword.submitButton')}
          </Button>
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
            <Link to="/login" className="font-semibold text-primary hover:underline dark:text-slate-400 dark:hover:text-slate-200">
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
