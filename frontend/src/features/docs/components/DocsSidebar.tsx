import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { docsNavigation } from '../config/docsNavigation';

export function DocsSidebar() {
  const { t } = useTranslation('docs');

  const getCategoryKey = (category: string) => {
    switch (category) {
      case 'Getting Started': return 'sidebar.gettingStarted';
      case 'Core Concepts': return 'sidebar.coreConcepts';
      case 'Features': return 'sidebar.features';
      case 'Account': return 'sidebar.account';
      default: return category;
    }
  };

  const getArticleKey = (slug: string) => {
    switch (slug) {
      case 'home': return 'home.title';
      case 'how-it-works': return 'how_it_works.title';
      case 'workspace': return 'workspace.title';
      case 'projects': return 'projects.title';
      case 'issues': return 'issues.title';
      case 'board': return 'board.title';
      case 'roadmap': return 'roadmap.title';
      case 'account': return 'account.title';
      default: return slug;
    }
  };

  return (
    <div className="flex flex-col gap-8 text-slate-600 dark:text-slate-400">
      {docsNavigation.map((section) => (
        <div key={section.category}>
          <div className="flex items-center gap-2 px-3 mb-2 text-xs font-semibold tracking-wider uppercase text-slate-900 dark:text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            {t(getCategoryKey(section.category))}
          </div>
          <div className="flex flex-col gap-1">
            {section.articles.map((article) => {
              const to = article.slug === 'home' ? '/docs' : `/docs/${article.slug}`;
              return (
                <NavLink
                  key={article.slug}
                  to={to}
                  end={article.slug === 'home'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{t(getArticleKey(article.slug))}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
