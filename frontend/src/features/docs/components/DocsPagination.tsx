import { docsNavigation } from '../config/docsNavigation';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function DocsPagination({ currentSlug }: { currentSlug: string }) {
  const { t } = useTranslation('docs');
  const allArticles = docsNavigation.flatMap((s) => s.articles);
  const idx = allArticles.findIndex((a) => a.slug === currentSlug);
  const prev = allArticles[idx - 1];
  const next = allArticles[idx + 1];

  const getArticleTitle = (slug: string, fallback: string) => {
    return t(`${slug.replace(/-/g, '_')}.title` as any, { defaultValue: fallback } as any);
  };

  return (
    <div className="flex justify-between pt-8">
      {prev ? <Link to={prev.slug === 'home' ? '/docs' : `/docs/${prev.slug}`}>← {getArticleTitle(prev.slug, prev.title)}</Link> : <div />}
      {next ? <Link to={next.slug === 'home' ? '/docs' : `/docs/${next.slug}`}>{getArticleTitle(next.slug, next.title)} →</Link> : <div />}
    </div>
  );
}
