import { useEffect } from 'react';
import { Info, Loader2, RotateCw, Sparkles, Square } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useGuideStream } from '@/hooks/useGuideStream';
import { useGetAiStatusQuery, useGetPaperGuideQuery } from '@/redux/api/ai';
import { useAppSelector } from '@/redux/hooks';
import { Button } from '@/shadcn/components/ui/button';
import type { IngestStatus } from '@/types/paper';
import { MarkdownView } from './MarkdownView';

interface PaperGuideProps {
  paperId: number;
  ingestStatus: IngestStatus;
}

export default function PaperGuide({ paperId, ingestStatus }: PaperGuideProps) {
  const intl = useIntl();
  const language = useAppSelector((state) => state.locale.locale);
  const { data: status } = useGetAiStatusQuery();
  const {
    data: guide,
    isLoading,
    refetch,
  } = useGetPaperGuideQuery({ id: paperId, lang: language });
  const stream = useGuideStream(intl.formatMessage({ id: 'ai.error' }));
  const { stop, clear } = stream;

  // 切换语言后原来的生成结果不再对应当前语言
  useEffect(() => {
    stop();
    clear();
  }, [language, stop, clear]);

  const generate = async () => {
    const result = await stream.generate(
      `/api/Ai/PaperGuide?id=${paperId}&lang=${encodeURIComponent(language)}`,
    );
    // 先取回缓存再清空流式内容，否则完成时页面会闪一下
    if (result === 'completed') await refetch();
    clear();
  };

  const ingesting = ingestStatus === 'pending' || ingestStatus === 'processing';
  const content = stream.content || guide?.content;
  const canGenerate = status?.enabled && !ingesting;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-2 pb-2">
        <p className="min-w-0 truncate text-xs text-gray-500">
          {guide && !stream.isGenerating
            ? intl.formatMessage(
                { id: 'guide.generatedBy' },
                { model: guide.model },
              )
            : intl.formatMessage({ id: 'guide.description' })}
        </p>
        {stream.isGenerating ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={stop}
            className="h-7 shrink-0 rounded-sm text-xs"
          >
            <Square />
            {intl.formatMessage({ id: 'guide.stop' })}
          </Button>
        ) : (
          canGenerate &&
          (guide ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={generate}
              className="h-7 shrink-0 rounded-sm text-xs"
            >
              <RotateCw />
              {intl.formatMessage({ id: 'guide.regenerate' })}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={generate}
              className="h-7 shrink-0 rounded-sm bg-[var(--office-blue)] text-xs"
            >
              <Sparkles />
              {intl.formatMessage({ id: 'guide.generate' })}
            </Button>
          ))
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {stream.error && (
          <p className="mb-3 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-700">
            {stream.error}
          </p>
        )}
        {content ? (
          <div className="ai-markdown break-words text-sm leading-6 text-gray-700">
            <MarkdownView>{content}</MarkdownView>
          </div>
        ) : stream.isGenerating || isLoading ? (
          <p className="flex items-center justify-center gap-1.5 py-10 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {intl.formatMessage({
              id: stream.isGenerating ? 'guide.generating' : 'common.loading',
            })}
          </p>
        ) : (
          <p className="flex items-start gap-1.5 rounded-sm bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {intl.formatMessage({
              id: !status?.enabled
                ? 'ai.notConfigured'
                : ingesting
                  ? 'papers.ingest.processing'
                  : 'guide.empty',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
