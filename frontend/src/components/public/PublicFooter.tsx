import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PublicFooter() {
  const { t } = useTranslation('public');

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6 text-slate-600 dark:text-slate-400">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-6 font-medium">
          <Link to="/product" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {t('footer.product', 'Product')}
          </Link>
          <Link to="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {t('footer.docs', 'Docs')}
          </Link>
          <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {t('footer.signIn', 'Sign in')}
          </Link>
          <Link to="/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {t('footer.getStarted', 'Get Started')}
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          © 2026 FlowBoard. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
