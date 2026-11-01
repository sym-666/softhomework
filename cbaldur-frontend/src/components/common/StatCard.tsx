import type { ComponentType } from 'react';
import { Link } from 'wouter';

interface StatCardProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  /** 提供时整张卡片可以点击 */
  href?: string;
}

export function StatCard({ icon: Icon, label, value, href }: StatCardProps) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-blue-50 text-[var(--office-blue)]">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-gray-900">
          {value}
        </p>
      </div>
    </>
  );
  const className =
    'flex items-center gap-3 border border-gray-200 bg-white p-4';

  return href ? (
    <Link
      href={href}
      className={`${className} hover:border-[var(--office-blue)]`}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
