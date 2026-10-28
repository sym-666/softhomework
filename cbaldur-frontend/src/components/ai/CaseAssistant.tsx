import React, { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { LineChart, RotateCcw } from 'lucide-react';
import { Button } from '@/shadcn/components/ui/button';
import { Switch } from '@/shadcn/components/ui/switch';
import { useGetAiStatusQuery } from '@/redux/api/ai';
import { useAiChatStream } from '@/hooks/useAiChatStream';
import AiChatPanel from './AiChatPanel';
import { SuggestionList, useSuggestionSelection } from './SuggestionList';
import type { AiChatItem, PlotRequest, ProposedFieldChange } from '@/types/Ai';

interface CaseAssistantProps {
  /** 算例 UUID */
  caseId: string;
  /** 算例所有者 */
  userId?: string;
  /** 将绘图请求应用到页面图表；未提供时不显示应用按钮（例如算例未成功） */
  onApplyPlot?: (plot: PlotRequest) => void;
  /** 以本算例参数为基础、叠加建议后新建算例；未提供时不显示（如 namelist 算例） */
  onRerunWithChanges?: (changes: ProposedFieldChange[]) => void;
  onClose?: () => void;
}

const describePlot = (plot: PlotRequest) => {
  const times =
    plot.mode === 'time' ? (plot.times ?? []).join(', ') : plot.time;
  const y = plot.expression ? `${plot.expression}` : plot.y;
  return `${plot.type} · ${y} vs ${plot.x}${times ? ` @ ${times}` : ''}`;
};

/**
 * 算例助手：分析结果 / 解释日志 / 生成绘图请求（迁移自 fusim-ai-assistant 的算例助手）
 */
const CaseAssistant: React.FC<CaseAssistantProps> = ({
  caseId,
  userId,
  onApplyPlot,
  onRerunWithChanges,
  onClose,
}) => {
  const intl = useIntl();
  const selection = useSuggestionSelection();

  const url = useMemo(() => {
    const params = new URLSearchParams({ id: caseId });
    if (userId) params.set('userId', userId);
    return `/api/Ai/CaseChat?${params.toString()}`;
  }, [caseId, userId]);

  const { data: status } = useGetAiStatusQuery();
  // 深度分析：DeepSeek 开启思考，不调用工具
  const [deepAnalysis, setDeepAnalysis] = useState(false);

  const buildBody = useCallback(
    (message: string, history: unknown[]) => ({
      message,
      history,
      deepAnalysis,
    }),
    [deepAnalysis],
  );

  const chat = useAiChatStream({
    url,
    buildBody,
    errorText: intl.formatMessage({ id: 'ai.error' }),
  });

  const shortcuts = useMemo(
    () =>
      [
        'summary',
        'convergence',
        'log',
        'plot',
        ...(status?.sandbox ? ['python'] : []),
        'papers',
      ].map((key) => intl.formatMessage({ id: `ai.case.shortcut.${key}` })),
    [intl, status?.sandbox],
  );

  const renderExtras = (item: AiChatItem) => (
    <>
      {onRerunWithChanges && (
        <SuggestionList
          item={item}
          selection={selection}
          actions={
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const targets = selection.pick(item, true);
                if (targets.length === 0) return;
                selection.markApplied(targets.map(({ key }) => key));
                onRerunWithChanges(targets.map(({ change }) => change));
              }}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              {intl.formatMessage({ id: 'ai.case.rerunWithChanges' })}
            </Button>
          }
        />
      )}
      {renderPlots(item)}
    </>
  );

  const renderPlots = (item: AiChatItem) => {
    if (!item.plots?.length) return null;
    return (
      <div className="space-y-1.5">
        {item.plots.map((plot, index) => (
          <div
            key={`${item.id}-plot-${index}`}
            className="flex items-center gap-2 rounded-md border border-[var(--office-blue)]/30 bg-[var(--office-blue-light)]/30 p-2 text-xs"
          >
            <LineChart className="h-4 w-4 shrink-0 text-[var(--office-blue)]" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-700">
                {intl.formatMessage({ id: 'ai.case.plot' })}
              </div>
              <div className="break-all font-mono text-gray-600">
                {describePlot(plot)}
              </div>
            </div>
            {onApplyPlot && (
              <Button
                type="button"
                size="sm"
                className="h-7 shrink-0 text-xs"
                onClick={() => {
                  onApplyPlot(plot);
                  toast.success(
                    intl.formatMessage({ id: 'ai.case.plotApplied' }),
                  );
                }}
              >
                {intl.formatMessage({ id: 'ai.case.applyPlot' })}
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AiChatPanel
      title={intl.formatMessage({ id: 'ai.case.title' })}
      subtitle={intl.formatMessage({ id: 'ai.case.subtitle' })}
      emptyText={intl.formatMessage({ id: 'ai.case.empty' })}
      items={chat.items}
      isStreaming={chat.isStreaming}
      shortcuts={shortcuts}
      onSend={chat.send}
      onStop={chat.stop}
      onReset={() => {
        chat.reset();
        selection.reset();
      }}
      onClose={onClose}
      renderExtras={renderExtras}
      toolbar={
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <Switch
            size="sm"
            checked={deepAnalysis}
            disabled={chat.isStreaming}
            onCheckedChange={setDeepAnalysis}
          />
          <span>{intl.formatMessage({ id: 'ai.case.deepAnalysis' })}</span>
          <span className="truncate text-gray-400">
            {intl.formatMessage({
              id: deepAnalysis
                ? 'ai.case.deepAnalysisHint'
                : 'ai.case.agentModeHint',
            })}
          </span>
        </label>
      }
    />
  );
};

export default CaseAssistant;
