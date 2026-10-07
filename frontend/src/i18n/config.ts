import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from '../locales/en/common.json';
import authEn from '../locales/en/auth.json';
import workspaceEn from '../locales/en/workspace.json';
import issuesEn from '../locales/en/issues.json';
import landingEn from '../locales/en/landing.json';
import settingsEn from '../locales/en/settings.json';
import docsEn from '../locales/en/docs.json';
import publicEn from '../locales/en/public.json';

import commonVi from '../locales/vi/common.json';
import authVi from '../locales/vi/auth.json';
import workspaceVi from '../locales/vi/workspace.json';
import issuesVi from '../locales/vi/issues.json';
import landingVi from '../locales/vi/landing.json';
import settingsVi from '../locales/vi/settings.json';
import docsVi from '../locales/vi/docs.json';
import publicVi from '../locales/vi/public.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: commonEn, auth: authEn, workspace: workspaceEn, issues: issuesEn, landing: landingEn, settings: settingsEn, docs: docsEn, public: publicEn },
      vi: { common: commonVi, auth: authVi, workspace: workspaceVi, issues: issuesVi, landing: landingVi, settings: settingsVi, docs: docsVi, public: publicVi },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'workspace', 'issues', 'landing', 'settings', 'docs', 'public'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
