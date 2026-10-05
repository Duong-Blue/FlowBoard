import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../utils/api_helper';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { OAuthButtons } from '../../components/shared/OAuthButtons';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailParam = searchParams.get('email');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', { firstName, lastName, email, password }).then(res => res.data);
      toast.success('Registration successful! Please login.');
      
      const locationState = location.state as { from?: unknown } | null;
      if (locationState?.from) {
        navigate(locationState.from as any);
      } else {
        navigate('/login');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-none border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('register.title')}</CardTitle>
        <CardDescription className="dark:text-slate-400">
          {t('register.subtitle')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('register.firstNameLabel')}</Label>
              <Input
                id="firstName"
                type="text"
                placeholder={t('register.firstNamePlaceholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('register.lastNameLabel')}</Label>
              <Input
                id="lastName"
                type="text"
                placeholder={t('register.lastNamePlaceholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('register.emailLabel')}</Label>
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
          <div className="space-y-2">
            <Label htmlFor="password">{t('register.passwordLabel')}</Label>
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
            {isLoading ? t('register.submittingButton') : t('register.submitButton')}
          </Button>
          <OAuthButtons disabled={isLoading} />
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline dark:hover:text-slate-200">
              {t('register.loginLink')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
