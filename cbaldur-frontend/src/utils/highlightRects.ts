import type { HighlightRect } from '@/types/highlight';

const MIN_SIZE_PX = 1;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const sameLine = (a: HighlightRect, b: HighlightRect) => {
  const overlap = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return overlap > Math.min(a.height, b.height) / 2;
};

/**
 * 把选区的屏幕矩形换算成相对页面的比例。
 * 文本层每段文字一个矩形，同一行的合并后不会因为重叠出现深浅不一的条纹。
 */
export function toHighlightRects(
  clientRects: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>[],
  page: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): HighlightRect[] {
  const rects = clientRects
    .filter((rect) => rect.width > MIN_SIZE_PX && rect.height > MIN_SIZE_PX)
    .map((rect) => {
      const x = clamp((rect.left - page.left) / page.width);
      const y = clamp((rect.top - page.top) / page.height);
      const right = clamp((rect.left + rect.width - page.left) / page.width);
      const bottom = clamp((rect.top + rect.height - page.top) / page.height);
      return { x, y, width: right - x, height: bottom - y };
    })
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const merged: HighlightRect[] = [];
  for (const rect of rects) {
    const last = merged[merged.length - 1];
    if (last && sameLine(last, rect)) {
      const right = Math.max(last.x + last.width, rect.x + rect.width);
      const bottom = Math.max(last.y + last.height, rect.y + rect.height);
      last.x = Math.min(last.x, rect.x);
      last.y = Math.min(last.y, rect.y);
      last.width = right - last.x;
      last.height = bottom - last.y;
    } else {
      merged.push({ ...rect });
    }
  }
  return merged;
}
