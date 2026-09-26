import 'i18next';
import common from '../locales/en/common.json';
import auth from '../locales/en/auth.json';
import workspace from '../locales/en/workspace.json';
import issues from '../locales/en/issues.json';
import landing from '../locales/en/landing.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      workspace: typeof workspace;
      issues: typeof issues;
      landing: typeof landing;
    };
  }
}
