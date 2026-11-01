import React, { useCallback, useEffect, useMemo } from 'react';
import { FileText, Info } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { useAiChatStream } from '@/hooks/useAiChatStream';
import {
  useClearChatHistoryMutation,
  useGetAiStatusQuery,
  useGetChatHistoryQuery,
} from '@/redux/api/ai';
import type { AiChatItem, AiChatMessage } from '@/types/Ai';
import type { IngestStatus } from '@/types/paper';
import { selectCitedSources } from '@/utils/citations';
import AiChatPanel from './AiChatPanel';

interface PaperAssistantProps {
  paperId: number;
  ingestStatus: IngestStatus;
  onJumpToPage: (page: number) => void;
  draftRequest?: { text: string } | null;
}

const SHORTCUTS = ['summary', 'method', 'result', 'concept'];

/** 论文问答：基于全文回答，来源页可以点击跳转 */
const PaperAssistant: React.FC<PaperAssistantProps> = ({
  paperId,
  ingestStatus,
  onJumpToPage,
  draftRequest,
}) => {
  const intl = useIntl();
  const { data: status, isLoading } = useGetAiStatusQuery();
  const url = `/api/Ai/PaperChat?id=${paperId}`;

  const buildBody = useCallback(
    (message: string, history: AiChatMessage[]) => ({ message, history }),
    [],
  );

  const chat = useAiChatStream({
    url,
    buildBody,
    errorText: intl.formatMessage({ id: 'ai.error' }),
  });
  const { hydrate, reset } = chat;
  // 对话在流结束时才写入服务端，缓存的结果可能已经过期
  const { data: history } = useGetChatHistoryQuery(paperId, {
    refetchOnMountOrArgChange: true,
  });
  const [clearHistory] = useClearChatHistoryMutation();

  useEffect(() => {
    if (!history) return;
    hydrate(
      history.map(({ id, role, content, citations }) => ({
        id: `saved-${id}`,
        role,
        content,
        citations,
      })),
    );
  }, [history, hydrate]);

  const clearChat = async () => {
    reset();
    try {
      await clearHistory(paperId).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'ai.paper.clearError' }));
    }
  };

  const shortcuts = useMemo(
    () =>
      SHORTCUTS.map((key) =>
        intl.formatMessage({ id: `ai.paper.shortcut.${key}` }),
      ),
    [intl],
  );

  const renderExtras = (item: AiChatItem) => {
    // 流式过程中页码可能只输出了一半，结束后再显示
    if (item.streaming) return null;
    const sources = selectCitedSources(item.citations, item.content);
    if (sources.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <span>{intl.formatMessage({ id: 'ai.paper.sources' })}</span>
        {sources.map((source) => (
          <button
            key={source.page}
            type="button"
            title={source.snippet}
            onClick={() => onJumpToPage(source.page)}
            className="inline-flex items-center gap-1 rounded-sm border border-gray-200 px-1.5 py-0.5 text-[var(--office-blue)] hover:border-[var(--office-blue)]"
          >
            <FileText className="h-3 w-3" />
            {intl.formatMessage({ id: 'ai.paper.page' }, { page: source.page })}
          </button>
        ))}
      </div>
    );
  };

  const notice = (id: string) => (
    <p className="m-3 flex items-start gap-1.5 rounded-sm bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {intl.formatMessage({ id })}
    </p>
  );

  if (isLoading) return null;
  if (!status?.enabled) return notice('ai.notConfigured');
  if (ingestStatus === 'pending' || ingestStatus === 'processing') {
    return notice('papers.ingest.processing');
  }

  return (
    <AiChatPanel
      title={intl.formatMessage({ id: 'ai.paper.title' })}
      subtitle={intl.formatMessage({
        id:
          ingestStatus === 'ready'
            ? 'ai.paper.subtitleFullText'
            : 'ai.paper.subtitleAbstract',
      })}
      emptyText={intl.formatMessage({ id: 'ai.paper.empty' })}
      items={chat.items}
      isStreaming={chat.isStreaming}
      shortcuts={shortcuts}
      onSend={chat.send}
      onStop={chat.stop}
      onReset={clearChat}
      resetLabel={intl.formatMessage({ id: 'ai.paper.clear' })}
      renderExtras={renderExtras}
      draftRequest={draftRequest}
    />
  );
};

export default PaperAssistant;
