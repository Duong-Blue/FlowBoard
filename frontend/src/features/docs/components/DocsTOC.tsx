import { useEffect, useState } from 'react';

export function DocsTOC({ containerRef }: { containerRef: React.RefObject<HTMLElement> }) {
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = Array.from(containerRef.current.querySelectorAll('h2, h3'));
    setHeadings(elements.map((el) => ({ id: el.id, text: el.textContent || '' })));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveId(e.target.id)),
      { rootMargin: '-20% 0px -80% 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [containerRef]);

  return (
    <ul className="space-y-2 text-sm">
      {headings.map(({ id, text }) => (
        <li key={id} className={activeId === id ? 'text-primary font-medium' : 'text-muted-foreground'}>
          <a href={`#${id}`}>{text}</a>
        </li>
      ))}
    </ul>
  );
}
