import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

export default function ResetSuccessPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  return (
    <Card className="w-full shadow-none border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-center">
      <CardHeader className="space-y-2 pt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold">{t('resetSuccess.title')}</CardTitle>
        <CardDescription className="dark:text-slate-400 max-w-sm mx-auto">
          {t('resetSuccess.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter className="flex flex-col space-y-4">
        <Button className="w-full" onClick={() => navigate('/login')}>
          {t('resetSuccess.loginButton')}
        </Button>
      </CardFooter>
    </Card>
  );
}
