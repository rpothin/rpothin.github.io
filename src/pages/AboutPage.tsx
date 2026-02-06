import { useState, useEffect } from 'react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface AboutPageProps {
  onMeta: (meta: { title: string; path: string; readingTime: number }) => void;
}

export function AboutPage({ onMeta }: AboutPageProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    fetch('/content/about.html')
      .then((r) => r.text())
      .then((content) => {
        setHtml(content);
        const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
        onMeta({
          title: 'About',
          path: 'about',
          readingTime: Math.max(1, Math.round(wordCount / 200)),
        });
      })
      .catch(console.error);
  }, [onMeta]);

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--vscode-tab-inactiveForeground)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <MarkdownRenderer html={html} />
    </div>
  );
}
