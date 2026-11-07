import type { ComponentType } from 'react';
import { Link } from 'wouter';
import { TONES, type Tone } from '@/utils/palette';

interface StatCardProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  tone?: Tone;
  /** 数值下方的补充说明 */
  hint?: string;
  /** 提供时整张卡片可以点击 */
  href?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'blue',
  hint,
  href,
}: StatCardProps) {
  const colors = TONES[tone];
  const content = (
    <>
      {/* 右上角的光晕只做装饰 */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full ${colors.glow} transition-transform duration-300 group-hover:scale-125`}
      />
      <span
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${colors.gradient} text-white shadow-md`}
      >
        <Icon size={20} />
      </span>
      <div className="relative min-w-0">
        <p className="truncate text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900">
          {value}
        </p>
        {hint && <p className="truncate text-[11px] text-gray-400">{hint}</p>}
      </div>
    </>
  );
  const className =
    'group relative flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md';

  return href ? (
    <Link href={href} className={`${className} cursor-pointer`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
