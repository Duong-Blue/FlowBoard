import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard } from "lucide-react";

export default function PublicFooter() {
  const { t } = useTranslation('landing');

  return (
    <footer className="border-t border-slate-200 bg-slate-100 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xl">
              <LayoutDashboard className="h-6 w-6 text-indigo-600" />
              <span>FlowBoard</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('footer.subtitle')}
            </p>
            <div className="flex items-center text-xs font-medium text-slate-600 pt-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              <span>{t('footer.allSystems')}</span>
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
              {t('footer.product')}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="hover:text-slate-900 transition-colors">
                  {t('footer.features')}
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-slate-900 transition-colors">
                  {t('footer.workflow')}
                </a>
              </li>
              <li>
                <a href="#highlights" className="hover:text-slate-900 transition-colors">
                  {t('footer.highlights')}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
              {t('footer.resources')}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span
                  className="inline-flex items-center gap-2 text-slate-400 cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  {t('footer.documentation')}
                  <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    {t('footer.soon')}
                  </span>
                </span>
              </li>
              <li>
                <span
                  className="inline-flex items-center gap-2 text-slate-400 cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  {t('footer.changelog')}
                  <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    {t('footer.comingSoon')}
                  </span>
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Account */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
              {t('footer.account')}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/login" className="hover:text-slate-900 transition-colors">
                  {t('footer.signIn')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-slate-900 transition-colors">
                  {t('footer.getStarted')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-left">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
