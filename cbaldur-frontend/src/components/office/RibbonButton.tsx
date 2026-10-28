import React from 'react';

interface RibbonButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  size?: 'large' | 'small';
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const RibbonButton: React.FC<RibbonButtonProps> = ({
  icon: Icon,
  label,
  size = 'large',
  active = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  if (size === 'small') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs transition-colors
          ${active ? 'bg-[var(--ribbon-active)] text-[var(--office-blue)]' : 'hover:bg-[var(--ribbon-hover)]'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${className}`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-sm min-w-[56px] transition-colors
        ${active ? 'bg-[var(--ribbon-active)] text-[var(--office-blue)]' : 'hover:bg-[var(--ribbon-hover)]'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
    >
      <Icon className="w-6 h-6 shrink-0" />
      <span className="text-[10px] leading-tight whitespace-nowrap">{label}</span>
    </button>
  );
};
