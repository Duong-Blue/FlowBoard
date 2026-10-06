import type { DocsSectionModel } from '@/types/docs';

export const docsNavigation: DocsSectionModel[] = [
  {
    category: 'Getting Started',
    articles: [
      { title: 'Home', slug: 'home', content: '' },
      { title: 'How It Works', slug: 'how-it-works', content: '' },
    ],
  },
  {
    category: 'Core Concepts',
    articles: [
      { title: 'Workspace', slug: 'workspace', content: '' },
      { title: 'Projects', slug: 'projects', content: '' },
      { title: 'Issues', slug: 'issues', content: '' },
    ],
  },
  {
    category: 'Features',
    articles: [
      { title: 'Board', slug: 'board', content: '' },
      { title: 'Roadmap', slug: 'roadmap', content: '' },
    ],
  },
  {
    category: 'Account',
    articles: [
      { title: 'Account', slug: 'account', content: '' },
    ],
  },
];
