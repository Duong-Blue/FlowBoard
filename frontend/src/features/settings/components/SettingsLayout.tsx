import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { User, Shield, Palette, Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SettingsLayout() {
  const { t } = useTranslation('settings');
  const location = useLocation();

  // If at exactly /workspace/settings or /workspace/settings/, redirect to /workspace/settings/profile
  if (location.pathname === '/workspace/settings' || location.pathname === '/workspace/settings/') {
    return <Navigate to="/workspace/settings/profile" replace />;
  }

  const navItems = [
    {
      path: '/workspace/settings/profile',
      label: t('layout.nav.profile'),
      icon: User,
      description: t('layout.nav.profileDesc'),
    },
    {
      path: '/workspace/settings/account',
      label: t('layout.nav.account'),
      icon: SettingsIcon,
      description: t('layout.nav.accountDesc'),
    },
    {
      path: '/workspace/settings/security',
      label: t('layout.nav.security'),
      icon: Shield,
      description: t('layout.nav.securityDesc'),
    },
    {
      path: '/workspace/settings/appearance',
      label: t('layout.nav.appearance'),
      icon: Palette,
      description: t('layout.nav.appearanceDesc'),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Settings Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t('layout.title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('layout.subtitle')}
        </p>
      </div>

      {/* Main Settings Body */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation Tabs */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap outline-none
                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border-l-2 md:border-l-4 border-blue-600 dark:border-blue-500 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content Area */}
        <main className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-xl p-2 md:p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
