import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { api } from '../../utils/api_helper';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { OAuthButtons } from '../../components/shared/OAuthButtons';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation('auth');

  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post<{ user: { id: string; email: string; name?: string; firstName: string; lastName: string }; accessToken: string; refreshToken: string }>('/auth/login', { email, password }).then(res => res.data);
      dispatch(setCredentials({
        user: response.user,
        accessToken: response.accessToken
      }));
      localStorage.setItem('refreshToken', response.refreshToken);
      toast.success('Logged in successfully');
      const from = (location.state as { from?: { pathname?: string; search?: string } })?.from?.pathname;
      const fromSearch = (location.state as { from?: { pathname?: string; search?: string } })?.from?.search;
      const redirectUrl = from + (fromSearch || '/workspace');
      navigate(redirectUrl, { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to login';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md shadow-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
        <CardDescription className="dark:text-slate-400">
          {t('login.subtitle')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={'name@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('login.passwordLabel')}</Label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('login.forgotPasswordLink')}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? t('login.submittingButton') : t('login.submitButton')}
          </Button>
          <OAuthButtons disabled={isLoading} />
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline dark:hover:text-slate-200">
              {t('login.registerLink')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
