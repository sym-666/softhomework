/**
 * 界面配色：沉稳的学术期刊色系，不用渐变和光晕。
 * 键名沿用颜色倾向，实际色值见 hex。类名必须完整写出，Tailwind 才能在构建时扫描到。
 */
export const TONES = {
  // 墨蓝
  blue: {
    hex: '#2f4a7a',
    solid: 'bg-[#2f4a7a]',
    soft: 'bg-[#e8ecf4] text-[#2f4a7a]',
    text: 'text-[#2f4a7a]',
    border: 'border-[#2f4a7a]',
  },
  // 葡萄紫
  violet: {
    hex: '#6f4a6e',
    solid: 'bg-[#6f4a6e]',
    soft: 'bg-[#f1e9f0] text-[#6f4a6e]',
    text: 'text-[#6f4a6e]',
    border: 'border-[#6f4a6e]',
  },
  // 苔绿
  emerald: {
    hex: '#4f7a5a',
    solid: 'bg-[#4f7a5a]',
    soft: 'bg-[#e9f1ea] text-[#3f6449]',
    text: 'text-[#4f7a5a]',
    border: 'border-[#4f7a5a]',
  },
  // 赭黄
  amber: {
    hex: '#b8862b',
    solid: 'bg-[#b8862b]',
    soft: 'bg-[#f6eedc] text-[#8a6420]',
    text: 'text-[#a2741f]',
    border: 'border-[#b8862b]',
  },
  // 朱砂
  rose: {
    hex: '#b8432f',
    solid: 'bg-[#b8432f]',
    soft: 'bg-[#f6e6e1] text-[#9c3726]',
    text: 'text-[#b8432f]',
    border: 'border-[#b8432f]',
  },
  // 青灰
  cyan: {
    hex: '#2f6f73',
    solid: 'bg-[#2f6f73]',
    soft: 'bg-[#e4f0f0] text-[#2a6266]',
    text: 'text-[#2f6f73]',
    border: 'border-[#2f6f73]',
  },
} as const;

export type Tone = keyof typeof TONES;

const TONE_NAMES = Object.keys(TONES) as Tone[];

/** 同一个字符串总是得到同一种颜色，例如同一个标签在各处颜色一致 */
export function toneFor(key: string): Tone {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return TONE_NAMES[hash % TONE_NAMES.length];
}

/** 由字符串得到稳定的 0–1 之间的数，用于书脊高度等装饰性差异 */
export function hashRatio(key: string): number {
  let hash = 7;
  for (const char of key) {
    hash = (hash * 131 + char.charCodeAt(0)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

/** ECharts 使用的颜色，与上面的配色一致 */
export const CHART_COLORS = [
  '#2f4a7a',
  '#b8432f',
  '#4f7a5a',
  '#b8862b',
  '#6f4a6e',
  '#2f6f73',
  '#8a6d4b',
  '#5b6b82',
];
