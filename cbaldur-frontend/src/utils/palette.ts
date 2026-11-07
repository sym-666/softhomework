/**
 * 界面配色。类名必须完整写出，Tailwind 才能在构建时扫描到。
 */
export const TONES = {
  blue: {
    gradient: 'from-blue-500 to-indigo-500',
    cover: 'from-blue-500 via-indigo-500 to-violet-500',
    soft: 'bg-blue-50 text-blue-700',
    text: 'text-blue-600',
    glow: 'bg-blue-400/15',
    bar: 'bg-blue-500',
  },
  violet: {
    gradient: 'from-violet-500 to-fuchsia-500',
    cover: 'from-violet-500 via-purple-500 to-fuchsia-500',
    soft: 'bg-violet-50 text-violet-700',
    text: 'text-violet-600',
    glow: 'bg-violet-400/15',
    bar: 'bg-violet-500',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-500',
    cover: 'from-emerald-500 via-teal-500 to-cyan-500',
    soft: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-600',
    glow: 'bg-emerald-400/15',
    bar: 'bg-emerald-500',
  },
  amber: {
    gradient: 'from-amber-400 to-orange-500',
    cover: 'from-amber-400 via-orange-500 to-rose-500',
    soft: 'bg-amber-50 text-amber-700',
    text: 'text-amber-600',
    glow: 'bg-amber-400/15',
    bar: 'bg-amber-500',
  },
  rose: {
    gradient: 'from-rose-500 to-pink-500',
    cover: 'from-rose-500 via-pink-500 to-fuchsia-500',
    soft: 'bg-rose-50 text-rose-700',
    text: 'text-rose-600',
    glow: 'bg-rose-400/15',
    bar: 'bg-rose-500',
  },
  cyan: {
    gradient: 'from-cyan-500 to-sky-500',
    cover: 'from-sky-500 via-cyan-500 to-teal-400',
    soft: 'bg-cyan-50 text-cyan-700',
    text: 'text-cyan-600',
    glow: 'bg-cyan-400/15',
    bar: 'bg-cyan-500',
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

/** ECharts 使用的十六进制颜色，与上面的配色对应 */
export const CHART_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#6366f1',
  '#14b8a6',
];
