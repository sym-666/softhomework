import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface StaticParamCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const StaticParamCard: React.FC<StaticParamCardProps> = ({
  title = '参数配置',
  description,
  children,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
      {description && (
        <div className="px-4 pt-3 text-sm text-gray-500">{description}</div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};
