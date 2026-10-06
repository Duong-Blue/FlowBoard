import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { ChevronRight, Clock, Copy, Info, Check, ThumbsUp, ThumbsDown, Edit, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DocsHomePage() {
  const { t } = useTranslation('docs');
  const [copied, setCopied] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<'yes' | 'no' | null>(null);
  const [activeSection, setActiveSection] = useState('overview');

  const copyCode = () => {
    const codeText = "npx flowboard@latest init --org acme-corp --template sprint-board\nflowboard auth login --token flw_live_839a9c8e20ab7183\nflowboard sync --project CORE-API --bind-branch";
    navigator.clipboard.writeText(codeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    const sections = document.querySelectorAll('article section[id]');
    const handleScroll = () => {
      let current = '';
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop - 120;
        if (window.scrollY >= sectionTop) {
          current = section.getAttribute('id') || '';
        }
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-9 gap-8 items-start">
      <article className="col-span-1 xl:col-span-6 flex flex-col gap-10 max-w-[768px]">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{t('homePage.breadcrumbDocs')}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{t('homePage.breadcrumbGettingStarted')}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 dark:text-indigo-400">{t('homePage.breadcrumbIntro')}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {t('homePage.mainTitle')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('homePage.mainDesc')}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {t('homePage.updatedAgo')}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-mono">
              {t('homePage.stableVersion')}
            </span>
          </div>
        </header>

        <div className="w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
          <img
            className="w-full h-56 object-cover"
            alt="Technical architecture diagram visualization"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOTVwWYmySnsgv9dULpLdCr58LYDmkgvjX_NikNRUABmgAzqq_aclg2IA7qOPmi9UtKLir3QhSNwx-bZ5JDifdzmcxkWDKEZEVtukLBCJK18-NhCsJIKH_pSv-2FsnM_Eut0gGDi1wqYYU8D15bJiui6WuE7jegd514vOCzY-4HGLnaQ-7X_eAYHyRxKLe47PuKjzwIr00KBvJtZPDvymqWmAzS5sTpG0VijnF2o-KKFT4Sus9YMY"
          />
        </div>

        <section className="flex flex-col gap-4 scroll-mt-24" id="overview">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('homePage.overviewTitle')}</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            {t('homePage.overviewP1')}
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            {t('homePage.overviewP2')}
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-white">{t('homePage.workspaceIsolationTitle')}</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <Trans i18nKey="homePage.workspaceIsolationDesc" t={t}>
                  FlowBoard isolates telemetry and workspace data strictly at the <strong>Organization</strong> level before drilling into Projects. API keys and service integrations cannot bridge organization barriers without explicit multi-tenant cross-grants.
                </Trans>
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 scroll-mt-24" id="architectural-scopes">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('homePage.archScopesTitle')}</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            {t('homePage.archScopesDesc')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: t('homePage.archScopeOrgTitle'),
                desc: t('homePage.archScopeOrgDesc'),
                color: 'text-indigo-600 dark:text-indigo-400',
                bg: 'bg-indigo-50 dark:bg-indigo-900/30'
              },
              {
                title: t('homePage.archScopeProjectTitle'),
                desc: t('homePage.archScopeProjectDesc'),
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-900/30'
              },
              {
                title: t('homePage.archScopeKanbanTitle'),
                desc: t('homePage.archScopeKanbanDesc'),
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-50 dark:bg-amber-900/30'
              },
              {
                title: t('homePage.archScopeIssueTitle'),
                desc: t('homePage.archScopeIssueDesc'),
                color: 'text-rose-600 dark:text-rose-400',
                bg: 'bg-rose-50 dark:bg-rose-900/30'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className={cn("px-2 py-1 rounded text-xs font-semibold font-mono", item.bg, item.color)}>
                    {item.title}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 scroll-mt-24" id="core-entity-model">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('homePage.coreEntityTitle')}</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            <Trans i18nKey="homePage.coreEntityDesc" t={t}>
              Every entity in FlowBoard carries deterministic prefix keys (e.g. <code className="font-mono text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">FLW-1042</code>) that resolve globally within an organization cluster.
            </Trans>
          </p>
          <ul className="flex flex-col gap-3 pl-4">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <strong>{t('homePage.coreEntityLi1Prefix')}</strong>{t('homePage.coreEntityLi1Text')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <strong>{t('homePage.coreEntityLi2Prefix')}</strong>{t('homePage.coreEntityLi2Text')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <strong>{t('homePage.coreEntityLi3Prefix')}</strong>{t('homePage.coreEntityLi3Text')}
              </span>
            </li>
          </ul>

          <div className="rounded-xl overflow-hidden bg-slate-900 dark:bg-black shadow-sm mt-2 border border-slate-800">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="ml-2 font-semibold">{t('homePage.terminalTitle')}</span>
              </div>
              <button 
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/50 text-slate-300 text-xs hover:bg-slate-700 hover:text-white transition-colors"
                type="button"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className={copied ? "text-emerald-400 font-semibold" : ""}>{copied ? t('homePage.copied') : t('homePage.copy')}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>
                <span className="text-slate-500">{t('homePage.codeComment1')}</span><br />
                <span className="text-emerald-400">npx</span> flowboard@latest init --org acme-corp --template sprint-board<br /><br />
                <span className="text-slate-500">{t('homePage.codeComment2')}</span><br />
                flowboard auth login --token <span className="text-amber-300">flw_live_839a9c8e20ab7183</span><br /><br />
                <span className="text-slate-500">{t('homePage.codeComment3')}</span><br />
                flowboard sync --project CORE-API --bind-branch
              </code>
            </pre>
          </div>
        </section>

        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 mt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="w-full sm:w-1/2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 opacity-60 flex flex-col gap-1 cursor-not-allowed">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('homePage.navPrev')}</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('homePage.navPrevTitle')}</span>
          </div>
          <Link to="/docs/how-it-works" className="w-full sm:w-1/2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all flex flex-col gap-1 text-right group">
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">{t('homePage.navNext')}</span>
            <div className="flex items-center justify-end gap-2 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <span>{t('homePage.navNextTitle')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('homePage.navNextDesc')}</p>
          </Link>
        </section>
      </article>

      <aside className="hidden xl:flex xl:col-span-3 flex-col sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pl-4">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
              <span>{t('homePage.tocTitle')}</span>
            </div>
            <nav className="flex flex-col gap-1 text-sm pl-3 border-l border-slate-200 dark:border-slate-800">
              <a
                href="#overview"
                className={cn(
                  "py-1.5 px-3 rounded transition-colors -ml-[1px] border-l-2",
                  activeSection === 'overview'
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {t('homePage.tocOverview')}
              </a>
              <a
                href="#architectural-scopes"
                className={cn(
                  "py-1.5 px-3 rounded transition-colors -ml-[1px] border-l-2",
                  activeSection === 'architectural-scopes'
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {t('homePage.tocArchScopes')}
              </a>
              <a
                href="#core-entity-model"
                className={cn(
                  "py-1.5 px-3 rounded transition-colors -ml-[1px] border-l-2",
                  activeSection === 'core-entity-model'
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {t('homePage.tocCoreEntity')}
              </a>
            </nav>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('homePage.feedbackTitle')}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveFeedback('yes')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border",
                  activeFeedback === 'yes'
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{t('homePage.feedbackYes')}</span>
              </button>
              <button 
                onClick={() => setActiveFeedback('no')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border",
                  activeFeedback === 'no'
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>{t('homePage.feedbackNo')}</span>
              </button>
            </div>
            <div className="pt-2 flex flex-col gap-2 text-xs">
              <a href="#" className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Edit className="w-3.5 h-3.5" />
                <span>{t('homePage.editPage')}</span>
              </a>
              <a href="#" className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t('homePage.joinDiscord')}</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default DocsHomePage;

