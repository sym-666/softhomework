import React from 'react';

interface RibbonGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const RibbonGroup: React.FC<RibbonGroupProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`flex items-stretch ${className}`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-0.5 px-1 pt-0.5 pb-0 flex-1">
          {children}
        </div>
        <div className="text-[10px] text-[var(--ribbon-group-label)] text-center pb-0.5 border-t border-[var(--ribbon-separator)] mt-auto">
          {title}
        </div>
      </div>
      <div className="w-px bg-[var(--ribbon-separator)] mx-1.5 my-1 self-stretch" />
    </div>
  );
};
