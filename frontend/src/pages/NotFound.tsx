import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";

export default function NotFound() {
  const { t } = useTranslation(['workspace', 'common']);
  useEffect(() => {
    document.title = t('notFound.title');
  }, [t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-700 mb-2">{t('notFound.title')}</h2>
      <p className="text-slate-500 max-w-md mb-8">
        {t('notFound.subtitle')}
      </p>
      <Button asChild>
        <Link to="/workspace">{t('notFound.backHome')}</Link>
      </Button>
    </div>
  );
}
