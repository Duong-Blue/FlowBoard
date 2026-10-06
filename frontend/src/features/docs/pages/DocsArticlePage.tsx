import { useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { docsNavigation } from '../config/docsNavigation';
import { DocsTOC } from '../components/DocsTOC';
import { ArticleRenderer } from '../components/ArticleRenderer';
import type { Section } from '../components/ArticleRenderer';
import { DocsPagination } from '../components/DocsPagination';

export function DocsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation('docs');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<any>(null);

  const slugSafe = slug || '';

  const article = docsNavigation
    .flatMap((s) => s.articles)
    .find((a) => a.slug === slugSafe);

  if (!article) {
    return <Navigate to="/docs/not-found" replace />;
  }

  const title = t(`${slugSafe.replace(/-/g, '_')}.title` as any, { defaultValue: article.title } as any);
  const descriptionArray = t(`${slugSafe.replace(/-/g, '_')}.description` as any, { returnObjects: true } as any);
  const imageText = t(`${slugSafe.replace(/-/g, '_')}.image` as any);
  
  const sections: Section[] = [
    {
      title: title as string,
      items: Array.isArray(descriptionArray) ? (descriptionArray as string[]) : [],
      paragraphs: imageText ? [imageText as string] : [],
    }
  ];

  return (
    <div className="flex gap-8 px-4 py-8">
      <main ref={containerRef} className="flex-1">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          {title as string}
        </h1>
        <ArticleRenderer sections={sections} />
        <DocsPagination currentSlug={slugSafe} />
      </main>
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-20">
          <h4 className="font-semibold text-sm mb-4">{t('homePage.tocTitle')}</h4>
          <DocsTOC containerRef={containerRef} />
        </div>
      </aside>
    </div>
  );
}

export default DocsArticlePage;
