import { lazy, Suspense } from 'react';

// KaTeX 体积较大，只在显示 AI 内容时加载
const Markdown = lazy(() => import('./Markdown'));

export function MarkdownView({ children }: { children: string }) {
  return (
    <Suspense fallback={<p className="whitespace-pre-wrap">{children}</p>}>
      <Markdown>{children}</Markdown>
    </Suspense>
  );
}
