import React, { useEffect } from 'react';
import { useGetSupercomputersQuery } from '@/redux/api/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';
import { Button } from '@/shadcn/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  ListChecks,
  FileText,
} from 'lucide-react';

interface PanelInfo {
  id: string;
  description?: string | null;
}

interface DynamicCaseHeaderProps {
  configName: string;
  currentIndex: number;
  totalPanels: number;
  panels: PanelInfo[];
  selectedSupercomputer?: string;
  onPanelSelect: (panelIndex: number) => void;
  onSupercomputerChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoPrevious: boolean;
  isCommentPage?: boolean;
}

const DynamicCaseHeader: React.FC<DynamicCaseHeaderProps> = ({
  configName,
  currentIndex,
  totalPanels,
  panels,
  selectedSupercomputer,
  onPanelSelect,
  onSupercomputerChange,
  onNext,
  onPrevious,
  canGoPrevious,
  isCommentPage = false,
}) => {
  const { data: supercomputers, isLoading: isLoadingSupercomputers } =
    useGetSupercomputersQuery();
  const currentPageTitle =
    currentIndex < panels.length
      ? panels[currentIndex]?.id || `Panel ${currentIndex + 1}`
      : 'Configuration Complete';

  const progress =
    totalPanels > 1 ? Math.round((currentIndex / (totalPanels - 1)) * 100) : 0;

  // 后端不再提供默认值时，前端默认选中第一个可用超算
  useEffect(() => {
    if (!selectedSupercomputer && supercomputers && supercomputers.length > 0) {
      onSupercomputerChange(supercomputers[0]);
    }
  }, [selectedSupercomputer, supercomputers, onSupercomputerChange]);

  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      {/* Title row */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--office-blue-light)] text-[var(--office-blue)] shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">
              {configName.toUpperCase()}
            </div>
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {currentPageTitle}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">步骤</span>
          <span className="text-sm font-semibold text-[var(--office-blue)]">
            {currentIndex + 1}
          </span>
          <span className="text-xs text-gray-400">/ {totalPanels}</span>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
              <ListChecks className="h-3 w-3" />
              跳转到
            </label>
            <Select
              value={String(currentIndex)}
              onValueChange={(value) => onPanelSelect(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Select a panel to navigate" />
              </SelectTrigger>
              <SelectContent>
                {panels.map((panel, index) => (
                  <SelectItem key={panel.id} value={String(index)}>
                    {index + 1}. {panel.id}
                  </SelectItem>
                ))}
                <SelectItem value={String(panels.length)}>
                  {panels.length + 1}. Summary & Comment
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
              <Cpu className="h-3 w-3" />
              计算节点
            </label>
            <Select
              value={selectedSupercomputer}
              onValueChange={onSupercomputerChange}
              disabled={isLoadingSupercomputers || !supercomputers?.length}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Supercomputer" />
              </SelectTrigger>
              <SelectContent>
                {supercomputers?.map((sc) => (
                  <SelectItem key={sc} value={sc}>
                    {sc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          {canGoPrevious && (
            <Button variant="outline" onClick={onPrevious}>
              <ChevronLeft className="h-4 w-4" />
              上一项
            </Button>
          )}
          {!isCommentPage && (
            <Button
              onClick={onNext}
              className="bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)] text-white"
            >
              {currentIndex >= totalPanels - 2 ? '查看总结' : '下一项'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicCaseHeader;
