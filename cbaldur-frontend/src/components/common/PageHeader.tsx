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

/** 各页面顶部统一的标题栏 */
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
      className={`relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-xl border border-gray-200/80 bg-white px-5 py-4 shadow-sm ${className}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full ${colors.glow} blur-2xl`}
      />
      <div className="relative flex min-w-0 items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${colors.gradient} text-white shadow-md`}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="relative flex flex-wrap gap-2">{actions}</div>
      )}
    </div>
  );
}
