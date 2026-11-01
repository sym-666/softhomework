/** 相对页面的比例，取值 0 到 1，缩放后不用换算 */
export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HighlightColor = 'yellow' | 'green' | 'pink';

export interface Highlight {
  id: number;
  paperId: number;
  page: number;
  color: HighlightColor;
  text: string;
  rects: HighlightRect[];
  noteId: number | null;
  createdAt: string;
}

export interface NewHighlight {
  page: number;
  color: HighlightColor;
  text: string;
  rects: HighlightRect[];
}
