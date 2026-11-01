import type { Citation } from '@/types/Ai';

/** 提取回答中标注的页码，支持 [p.3]、[p.3, p.5] 这样的写法 */
export function extractCitedPages(content: string): Set<number> {
  const pages = new Set<number>();
  for (const bracket of content.matchAll(/\[([^\]]*)\]/g)) {
    for (const match of bracket[1].matchAll(/p\.\s*(\d+)/gi)) {
      pages.add(Number(match[1]));
    }
  }
  return pages;
}

/** 只保留回答实际引用、且确实检索到的页，模型编造的页码不显示为来源 */
export function selectCitedSources(
  citations: Citation[] | undefined,
  content: string,
): Citation[] {
  if (!citations) return [];
  const cited = extractCitedPages(content);
  return citations.filter((citation) => cited.has(citation.page));
}

/** 对比回答的引用：[P1 p.3]，一个括号里可以有多处，如 [P1 p.3, P2 p.5] */
export function selectComparedSources(
  citations: Citation[] | undefined,
  content: string,
): Citation[] {
  if (!citations) return [];
  const cited = new Set<string>();
  for (const bracket of content.matchAll(/\[([^\]]*)\]/g)) {
    for (const match of bracket[1].matchAll(/(P\d+)\s*p\.\s*(\d+)/gi)) {
      cited.add(`${match[1].toUpperCase()}:${match[2]}`);
    }
  }
  return citations.filter((citation) =>
    cited.has(`${citation.label}:${citation.page}`),
  );
}
