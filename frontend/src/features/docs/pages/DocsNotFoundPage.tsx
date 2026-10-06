import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function DocsNotFoundPage() {
  const { t } = useTranslation('docs');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {t('notFound.title', 'Article Not Found')}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        {t('notFound.subtitle', "The documentation page you are looking for doesn't exist or has been moved.")}
      </p>
      <Button asChild>
        <Link to="/docs">{t('notFound.backToDocs', 'Back to Documentation')}</Link>
      </Button>
    </div>
  );
}

export default DocsNotFoundPage;
