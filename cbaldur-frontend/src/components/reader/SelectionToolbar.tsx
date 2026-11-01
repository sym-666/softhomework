import type { ComponentType, ReactNode } from 'react';
import type { PdfSelection } from '@/hooks/usePdfSelection';

const TOOLBAR_HEIGHT = 40;
const VIEWPORT_MARGIN = 8;

interface SelectionToolbarProps {
  selection: PdfSelection;
  children: ReactNode;
}

export function SelectionToolbar({
  selection,
  children,
}: SelectionToolbarProps) {
  return (
    <div
      role="toolbar"
      style={{
        top: Math.max(VIEWPORT_MARGIN, selection.top - TOOLBAR_HEIGHT),
        left: selection.left,
      }}
      // 阻止默认行为，否则按下按钮时浏览器会先取消文字选区
      onMouseDown={(event) => event.preventDefault()}
      className="fixed z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-sm border border-gray-200 bg-white p-1 shadow-md"
    >
      {children}
    </div>
  );
}

interface SelectionActionProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

export function SelectionAction({
  icon: Icon,
  label,
  onClick,
}: SelectionActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1 rounded-sm px-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-[var(--office-blue)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
