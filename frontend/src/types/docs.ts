export interface DocsArticleModel {
  title: string;
  slug: string;
  content: string;
}

export interface DocsSectionModel {
  category: string;
  articles: DocsArticleModel[];
}
