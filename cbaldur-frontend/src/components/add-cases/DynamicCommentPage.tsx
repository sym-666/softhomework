import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { useCreateCaseMutation } from '@/redux/api/case';
import type { ConfigSchema } from '@/types/ConfigSchema';
import { initializePanel } from '@/redux/slices/dynamicFormSlice';
import { Button } from '@/shadcn/components/ui/button';
import { Textarea } from '@/shadcn/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shadcn/components/ui/dialog';
import {
  Download,
  Send,
  Eye,
  ChevronLeft,
  ClipboardList,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import DynamicCaseHeader from './DynamicCaseHeader';
import type { Panel } from '@/types/ConfigSchema';
import {
  DEFAULT_CASE_COMMENT,
  countCommentLines,
  normalizeCommentToFourLines,
  transformPanelDataForSubmission,
} from '@/utils/caseSubmission';
import { downloadTextFile } from '@/utils/downloadTextFile';

interface DynamicCommentPageProps {
  configName: string;
  schema: ConfigSchema;
  onBack: () => void;
  onSubmit: (createdId?: string) => void;
  panels: Panel[];
  currentIndex: number;
  totalPanels: number;
  selectedSupercomputer?: string;
  onPanelSelect: (index: number) => void;
  onSupercomputerChange: (value: string) => void;
}

const DynamicCommentPage: React.FC<DynamicCommentPageProps> = ({
  configName,
  schema,
  onBack,
  onSubmit,
  panels,
  currentIndex,
  totalPanels,
  selectedSupercomputer,
  onPanelSelect,
  onSupercomputerChange,
}) => {
  const [comment, setComment] = useState(DEFAULT_CASE_COMMENT);
  const rawCommentLineCount = countCommentLines(comment);
  const dispatch = useAppDispatch();
  const allPanelData = useAppSelector((state) => state.dynamicForm[configName]);
  const [createCase, { isLoading: isSubmitting }] = useCreateCaseMutation();

  // Initialize all panels when component mounts
  useEffect(() => {
    if (schema && schema.panels) {
      schema.panels.forEach((panel: Panel) => {
        dispatch(
          initializePanel({
            configName,
            panelId: panel.id,
            fields: panel.fields,
          }),
        );
      });
    }
  }, [schema, configName, dispatch]);

  // Debug: Log the data to see what's actually stored
  console.log('DynamicCommentPage - configName:', configName);
  console.log('DynamicCommentPage - allPanelData:', allPanelData);
  console.log('DynamicCommentPage - totalPanels:', totalPanels);
  console.log(
    'DynamicCommentPage - panel count:',
    Object.keys(allPanelData || {}).length,
  );

  if (!allPanelData) {
    return <div>Loading...</div>;
  }

  const handleExportJson = () => {
    const dataStr = JSON.stringify(allPanelData, null, 2);
    downloadTextFile(
      `${configName}-case-${new Date().toISOString().split('T')[0]}.json`,
      dataStr,
    );
    toast.success('JSON file has been exported.');
  };

  const handleFinalSubmit = async () => {
    if (!selectedSupercomputer) {
      toast.error('请先选择超算');
      return;
    }

    const caseJson = transformPanelDataForSubmission(schema, allPanelData);

    try {
      const res = await createCase({
        CaseJson: JSON.stringify(caseJson, null, 2),
        CaseJsonPrototype: JSON.stringify(allPanelData || {}, null, 2),
        Comment: normalizeCommentToFourLines(comment),
        SuperComputer: selectedSupercomputer,
      }).unwrap();
      console.log('CaseJson:', JSON.stringify(caseJson, null, 2));
      console.log(
        'CaseJsonPrototype:',
        JSON.stringify(allPanelData || {}, null, 2),
      );
      toast.success('算例提交成功!');
      onSubmit(res?.id);
    } catch (error) {
      console.error('Failed to submit case:', error);
      toast.error('算例提交失败，请检查参数');
    }
  };

  const renderArrayModal = (
    fieldId: string,
    value: any[] | { index?: any[]; values?: any[] },
  ) => {
    if (Array.isArray(value)) {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-[var(--office-blue)] hover:text-[var(--office-blue-dark)]"
            >
              <Eye className="h-3 w-3 mr-1" />[{value.length} items]
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{fieldId} Array Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              {value.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between py-1.5 px-3 rounded-sm border border-gray-100 bg-gray-50/50 text-sm"
                >
                  <span className="text-gray-500">[{index}]</span>
                  <span className="font-mono text-gray-900">{String(item)}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      );
    } else if (
      typeof value === 'object' &&
      value !== null &&
      'index' in value &&
      'values' in value
    ) {
      // Handle LongArray type
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-[var(--office-blue)] hover:text-[var(--office-blue-dark)]"
            >
              <Eye className="h-3 w-3 mr-1" />
              {`{index: ${value.index?.length || 0}, values: ${value.values?.length || 0}}`}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{fieldId} Long Array Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Index Array ({value.index?.length || 0} items)
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {(value.index || []).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between py-1 px-3 rounded-sm border border-gray-100 bg-gray-50/50 text-sm"
                    >
                      <span className="text-gray-500">[{index}]</span>
                      <span className="font-mono text-gray-900">
                        {String(item)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Values Array ({value.values?.length || 0} items)
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {(value.values || []).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between py-1 px-3 rounded-sm border border-gray-100 bg-gray-50/50 text-sm"
                    >
                      <span className="text-gray-500">[{index}]</span>
                      <span className="font-mono text-gray-900">
                        {String(item)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 pb-6">
      <DynamicCaseHeader
        configName={configName}
        currentIndex={currentIndex}
        totalPanels={totalPanels}
        panels={panels}
        onPanelSelect={onPanelSelect}
        onPrevious={onBack}
        onNext={() => {}} // No 'next' action on comment page
        canGoPrevious={true}
        isCommentPage={true}
        selectedSupercomputer={selectedSupercomputer}
        onSupercomputerChange={onSupercomputerChange}
      />

      {/* Action bar */}
      <div className="bg-white border border-gray-200 rounded-sm px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          返回
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleExportJson} variant="outline">
            <Download className="h-4 w-4" />
            导出为JSON
          </Button>
          <Button
            onClick={handleFinalSubmit}
            disabled={isSubmitting || !selectedSupercomputer}
            className="bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)] text-white"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? '提交中...' : '提交算例'}
          </Button>
        </div>
      </div>

      {/* Configuration summary */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">配置总结</h3>
        </div>
        <div className="p-4 space-y-3">
          {Object.keys(allPanelData).length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              没有配置文件，请你先完成配置
            </div>
          ) : (
            Object.entries(allPanelData).map(
              ([panelId, panelData]: [string, { [key: string]: any }]) => {
                const fieldCount = Object.keys(panelData).length;
                return (
                  <div
                    key={panelId}
                    className="rounded-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 border-b border-gray-100">
                      <Layers className="h-3.5 w-3.5 text-[var(--office-blue)]" />
                      <span className="text-sm font-semibold text-gray-900">
                        {panelId}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[var(--office-blue-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--office-blue)]">
                        {fieldCount} fields
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 text-sm">
                      {Object.entries(panelData).map(([fieldId, value]) => {
                        const isArray = Array.isArray(value);
                        const isLongArray =
                          typeof value === 'object' &&
                          value !== null &&
                          'index' in value &&
                          'values' in value;

                        return (
                          <div
                            key={fieldId}
                            className="flex justify-between items-center gap-2 py-1.5 px-3 rounded-sm border border-gray-100 bg-gray-50/50"
                          >
                            <span className="text-gray-500 font-medium truncate">
                              {fieldId}
                            </span>
                            <div className="text-right shrink-0">
                              {isArray || isLongArray ? (
                                renderArrayModal(fieldId, value)
                              ) : (
                                <span className="font-mono text-gray-900">
                                  {typeof value === 'boolean'
                                    ? value
                                      ? 'True'
                                      : 'False'
                                    : String(value)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              },
            )
          )}
        </div>
      </div>

      {/* Case remarks */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Case Remarks</h3>
            <p className="text-xs text-gray-500">
              算例 Comment（必须恰好 4 行；不足会补空行，超出并入第 4 行）
            </p>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={DEFAULT_CASE_COMMENT}
            rows={4}
            className="min-h-[120px] resize-y font-mono text-sm"
          />
          <p
            className={`text-xs ${
              rawCommentLineCount === 4
                ? 'text-gray-500'
                : 'text-amber-600'
            }`}
          >
            当前 {rawCommentLineCount} 行
            {rawCommentLineCount !== 4 ? '（提交时会自动规范为 4 行）' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DynamicCommentPage;
