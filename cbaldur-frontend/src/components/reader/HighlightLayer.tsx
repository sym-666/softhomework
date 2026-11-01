import type { Highlight, HighlightColor } from '@/types/highlight';

export const HIGHLIGHT_COLORS: Record<
  HighlightColor,
  { fill: string; swatch: string }
> = {
  yellow: { fill: 'bg-yellow-300/60', swatch: 'bg-yellow-300' },
  green: { fill: 'bg-green-300/60', swatch: 'bg-green-300' },
  pink: { fill: 'bg-pink-300/60', swatch: 'bg-pink-300' },
};

/** 不接收鼠标事件，高亮下面的文字仍然可以选中 */
export function HighlightLayer({ highlights }: { highlights: Highlight[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3]">
      {highlights.flatMap((highlight) =>
        highlight.rects.map((rect, index) => (
          <div
            key={`${highlight.id}-${index}`}
            data-highlight={highlight.id}
            className={`absolute mix-blend-multiply ${HIGHLIGHT_COLORS[highlight.color].fill}`}
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.width * 100}%`,
              height: `${rect.height * 100}%`,
            }}
          />
        )),
      )}
    </div>
  );
}
