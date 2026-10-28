import DOMPurify from 'dompurify';

export function ForumContent({ html, className = '' }: { html: string; className?: string }) {
  return (
    <div
      className={`forum-content text-sm leading-6 text-gray-700 ${className}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
