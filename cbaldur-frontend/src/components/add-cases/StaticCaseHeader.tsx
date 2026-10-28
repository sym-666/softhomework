import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/shadcn/components/ui/button';
import { ChevronLeft, ChevronRight, FileText, FilePlus2 } from 'lucide-react';

interface StaticCaseHeaderProps {
  title: string;
  stepNumber: number;
  totalSteps: number;
  description: string;
  previousPath?: string;
  nextPath?: string;
  nextLabel?: string;
  showSummary?: boolean;
}

export const StaticCaseHeader: React.FC<StaticCaseHeaderProps> = ({
  title,
  stepNumber,
  totalSteps,
  description,
  previousPath,
  nextPath,
  nextLabel = '下一项',
  showSummary = true,
}) => {
  const progress =
    totalSteps > 1
      ? Math.round(((stepNumber - 1) / (totalSteps - 1)) * 100)
      : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      {/* Title row */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--office-blue-light)] text-[var(--office-blue)] shrink-0">
            <FilePlus2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">
              STATIC
            </div>
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">步骤</span>
          <span className="text-sm font-semibold text-[var(--office-blue)]">
            {stepNumber}
          </span>
          <span className="text-xs text-gray-400">/ {totalSteps}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100">
        <div
          className="h-full bg-[var(--office-blue)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <p className="text-sm text-gray-500">{description}</p>
        <div className="flex gap-2">
          {previousPath && (
            <Link href={previousPath}>
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4" />
                上一项
              </Button>
            </Link>
          )}
          {showSummary && (
            <Link href="/add-cases/summary">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                查看总结
              </Button>
            </Link>
          )}
          {nextPath && (
            <Link href={nextPath}>
              <Button className="bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)] text-white">
                {nextLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
