import React from 'react';

export interface Section {
  title?: string;
  h2?: string;
  heading?: string;
  content?: string | string[];
  paragraphs?: string[];
  type?: 'paragraph' | 'list' | 'heading' | 'h2' | string;
  items?: string[];
  bullets?: string[];
}

export interface ArticleRendererProps {
  sections: Section[];
  className?: string;
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({ sections, className = '' }) => {
  return (
    <article className={`max-w-3xl leading-7 text-slate-700 space-y-6 ${className}`}>
      {sections.map((section, index) => {
        const headingText = section.h2 || section.title || section.heading;
        const listItems = section.items || section.bullets || (section.type === 'list' && Array.isArray(section.content) ? section.content : null);
        const paragraphText = typeof section.content === 'string' ? section.content : null;
        const paragraphs = section.paragraphs || (paragraphText ? [paragraphText] : []);

        return (
          <section key={index} className="space-y-3">
            {headingText && (
              <h2 id={`section-${index}`} className="text-2xl font-bold tracking-tight text-slate-900 scroll-mt-6">
                {headingText}
              </h2>
            )}

            {paragraphs.map((p, pIdx) => (
              <p key={pIdx}>{p}</p>
            ))}

            {listItems && listItems.length > 0 && (
              <ul className="list-disc list-inside space-y-1 pl-2">
                {listItems.map((item, itemIdx) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </article>
  );
};

export default ArticleRenderer;
