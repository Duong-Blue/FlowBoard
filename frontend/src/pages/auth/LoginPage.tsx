import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { apiPost } from '../../utils/api_helper';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const response = await apiPost<{ user: { id: string; email: string; name: string }; accessToken: string; refreshToken: string }>('/auth/login', { email, password });
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
    <Card className="w-full shadow-none border border-slate-200 bg-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
        <CardDescription>
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
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? t('login.submittingButton') : t('login.submitButton')}
          </Button>
          <div className="text-center text-sm text-slate-500">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              {t('login.registerLink')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
