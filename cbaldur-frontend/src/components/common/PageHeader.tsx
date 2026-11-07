import type { ComponentType, ReactNode } from 'react';
import { TONES, type Tone } from '@/utils/palette';

interface PageHeaderProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle?: ReactNode;
  tone?: Tone;
  /** 右侧的操作按钮 */
  actions?: ReactNode;
  className?: string;
}

/** 各页面顶部统一的标题栏：衬线标题、左侧色条 */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  tone = 'blue',
  actions,
  className = '',
}: PageHeaderProps) {
  const colors = TONES[tone];
  return (
    <div
      className={`relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] px-5 py-4 ${className}`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 ${colors.solid}`}
      />
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border ${colors.border} ${colors.text}`}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-lg font-semibold text-[var(--ink)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
