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

/** 期刊风格的统计卡片：顶部色条、衬线大数字 */
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
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-[3px] ${colors.solid}`}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium tracking-[0.18em] text-[var(--ink-soft)]">
          {label}
        </p>
        <Icon size={16} className={colors.text} />
      </div>
      <p className="mt-2 font-serif text-[32px] font-semibold leading-none tabular-nums text-[var(--ink)]">
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 truncate text-[11px] text-[var(--ink-soft)]">
          {hint}
        </p>
      )}
    </>
  );
  const className =
    'group relative block overflow-hidden rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] px-4 pb-3.5 pt-4 transition-colors';

  return href ? (
    <Link href={href} className={`${className} hover:border-[var(--ink)]`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
