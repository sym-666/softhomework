import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { HighlightRect } from '@/types/highlight';
import { toHighlightRects } from '@/utils/highlightRects';
import { cleanSelectedText } from '@/utils/selection';

export interface PdfSelection {
  text: string;
  /** 选区的视口坐标，工具条据此定位 */
  top: number;
  left: number;
  /** 相对页面的比例；选区不在页面内时为空 */
  rects: HighlightRect[];
}

/** 跟踪容器内的文字选区；松开鼠标时才读取，拖动过程中工具条不会闪动 */
export function usePdfSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<PdfSelection | null>(null);

  const clear = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    const read = () => {
      const current = window.getSelection();
      const container = containerRef.current;
      if (
        !current ||
        current.isCollapsed ||
        !container?.contains(current.anchorNode)
      ) {
        setSelection(null);
        return;
      }
      const text = cleanSelectedText(current.toString());
      if (!text) {
        setSelection(null);
        return;
      }
      const range = current.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const anchor = current.anchorNode;
      const pageElement = (
        anchor instanceof Element ? anchor : anchor?.parentElement
      )?.closest('.react-pdf__Page');
      setSelection({
        text,
        top: rect.top,
        left: rect.left + rect.width / 2,
        rects: pageElement
          ? toHighlightRects(
              [...range.getClientRects()],
              pageElement.getBoundingClientRect(),
            )
          : [],
      });
    };

    // 点击空白处取消选区时不会再有 mouseup 读取，这里负责收起工具条
    const closeWhenCollapsed = () => {
      if (window.getSelection()?.isCollapsed) setSelection(null);
    };

    document.addEventListener('mouseup', read);
    document.addEventListener('selectionchange', closeWhenCollapsed);
    return () => {
      document.removeEventListener('mouseup', read);
      document.removeEventListener('selectionchange', closeWhenCollapsed);
    };
  }, [containerRef]);

  return { selection, clear };
}
