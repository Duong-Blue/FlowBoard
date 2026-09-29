import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, type Theme } from '@/providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateUserLocally } from '@/store/slices/authSlice';
import { updateUserProfile } from '@/services/userService';
import { Sun, Moon, Laptop, Check, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AppearanceSettings() {
  const { t, i18n } = useTranslation('settings');
  const { theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [currentLang, setCurrentLang] = useState<string>(i18n.language || 'en');
  const [isSaving, setIsSaving] = useState<Theme | null>(null);
  const [isSavingLang, setIsSavingLang] = useState<string | null>(null);

  useEffect(() => {
    if (user?.theme && (user.theme === 'light' || user.theme === 'dark' || user.theme === 'system')) {
      if (user.theme !== theme) {
        setTheme(user.theme as Theme);
      }
    }
  }, [user?.theme]);

  const themeOptions: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    {
      value: 'light',
      label: t('appearance.themeSection.light.label'),
      icon: Sun,
      description: t('appearance.themeSection.light.description'),
    },
    {
      value: 'dark',
      label: t('appearance.themeSection.dark.label'),
      icon: Moon,
      description: t('appearance.themeSection.dark.description'),
    },
    {
      value: 'system',
      label: t('appearance.themeSection.system.label'),
      icon: Laptop,
      description: t('appearance.themeSection.system.description'),
    },
  ];

  const languages = [
    { code: 'en', name: t('appearance.languageSection.en.name'), flag: '🇺🇸', label: t('appearance.languageSection.en.label') },
    { code: 'vi', name: t('appearance.languageSection.vi.name'), flag: '🇻🇳', label: t('appearance.languageSection.vi.label') },
  ];

  const handleThemeSelect = async (newTheme: Theme) => {
    if (isSaving) return;
    const previousTheme = theme;
    setIsSaving(newTheme);

    setTheme(newTheme);
    dispatch(updateUserLocally({ theme: newTheme }));

    try {
      await updateUserProfile({ theme: newTheme });
      toast.success(t('appearance.themeSection.successToast', { theme: newTheme }));
    } catch (error) {
      setTheme(previousTheme);
      dispatch(updateUserLocally({ theme: previousTheme }));
      toast.error(t('appearance.themeSection.errorToast'));
    } finally {
      setIsSaving(null);
    }
  };

  const handleLanguageSelect = async (langCode: string) => {
    if (isSavingLang) return;
    const previousLang = currentLang;
    setIsSavingLang(langCode);
    setCurrentLang(langCode);
    i18n.changeLanguage(langCode);
    dispatch(updateUserLocally({ language: langCode }));

    try {
      await updateUserProfile({ language: langCode });
      toast.success(t('appearance.languageSection.successToast'));
    } catch {
      setCurrentLang(previousLang);
      i18n.changeLanguage(previousLang);
      dispatch(updateUserLocally({ language: previousLang }));
      toast.error(t('appearance.languageSection.errorToast'));
    } finally {
      setIsSavingLang(null);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t('appearance.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('appearance.subtitle')}
        </p>
      </div>

      {/* Theme Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {t('appearance.themeSection.title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('appearance.themeSection.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            const isOptionSaving = isSaving === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                disabled={!!isSaving}
                onClick={() => handleThemeSelect(opt.value)}
                className={`
                  relative flex flex-col p-4 rounded-xl border text-left transition-all cursor-pointer outline-none
                  disabled:opacity-75 disabled:cursor-not-allowed
                  ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 dark:ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }
                `}
              >
                {isOptionSaving ? (
                  <div className="absolute top-3 right-3 h-5 w-5 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : isSelected ? (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                ) : null}
                <div className={`p-2 rounded-lg w-fit mb-3 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {opt.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Section */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" /> {t('appearance.languageSection.title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('appearance.languageSection.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {languages.map((lang) => {
            const isSelected = currentLang.startsWith(lang.code);
            const isLangSaving = isSavingLang === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                disabled={!!isSavingLang}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`
                  relative flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer outline-none
                  disabled:opacity-75 disabled:cursor-not-allowed
                  ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 dark:ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }
                `}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {lang.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {lang.label}
                  </p>
                </div>
                {isLangSaving ? (
                  <div className="h-5 w-5 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : isSelected ? (
                  <div className="h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
