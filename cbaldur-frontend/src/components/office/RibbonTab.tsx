import React from 'react';

interface RibbonTabProps {
  label: string;
  active?: boolean;
  contextual?: boolean;
  onClick?: () => void;
}

export const RibbonTab: React.FC<RibbonTabProps> = ({
  label,
  active = false,
  contextual = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-medium transition-colors relative cursor-pointer
        ${contextual ? 'text-[#b33c00]' : ''}
        ${active
          ? 'bg-white text-[var(--office-blue)] border-t-2 border-t-[var(--office-blue)] border-x border-x-[var(--ribbon-separator)] -mb-px z-10'
          : 'hover:bg-white/60 border-t-2 border-t-transparent'
        }`}
    >
      {label}
    </button>
  );
};
