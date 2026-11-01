import { FileText, Info, Loader2, RotateCw, Sparkles } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import {
  useGenerateGlossaryMutation,
  useGetAiStatusQuery,
  useGetPaperGlossaryQuery,
} from '@/redux/api/ai';
import { useAppSelector } from '@/redux/hooks';
import { Button } from '@/shadcn/components/ui/button';
import type { IngestStatus } from '@/types/paper';

interface PaperGlossaryProps {
  paperId: number;
  ingestStatus: IngestStatus;
  onJumpToPage: (page: number) => void;
}

export default function PaperGlossary({
  paperId,
  ingestStatus,
  onJumpToPage,
}: PaperGlossaryProps) {
  const intl = useIntl();
  const language = useAppSelector((state) => state.locale.locale);
  const { data: status } = useGetAiStatusQuery();
  const { data: glossary, isLoading } = useGetPaperGlossaryQuery({
    id: paperId,
    lang: language,
  });
  const [generateGlossary, generateState] = useGenerateGlossaryMutation();
  const ingesting = ingestStatus === 'pending' || ingestStatus === 'processing';
  const canGenerate = status?.enabled && !ingesting;

  const generate = async () => {
    try {
      await generateGlossary({ id: paperId, lang: language }).unwrap();
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? intl.formatMessage({ id: 'ai.error' }));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-2 pb-2">
        <p className="min-w-0 truncate text-xs text-gray-500">
          {glossary
            ? intl.formatMessage(
                { id: 'guide.generatedBy' },
                { model: glossary.model },
              )
            : intl.formatMessage({ id: 'glossary.description' })}
        </p>
        {canGenerate && (
          <Button
            type="button"
            size="sm"
            variant={glossary ? 'outline' : 'default'}
            disabled={generateState.isLoading}
            onClick={generate}
            className={`h-7 shrink-0 rounded-sm text-xs ${
              glossary ? '' : 'bg-[var(--office-blue)]'
            }`}
          >
            {generateState.isLoading ? (
              <Loader2 className="animate-spin" />
            ) : glossary ? (
              <RotateCw />
            ) : (
              <Sparkles />
            )}
            {intl.formatMessage({
              id: generateState.isLoading
                ? 'glossary.generating'
                : glossary
                  ? 'guide.regenerate'
                  : 'glossary.generate',
            })}
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-2">
        {isLoading && (
          <p className="py-8 text-center text-sm text-gray-400">
            {intl.formatMessage({ id: 'common.loading' })}
          </p>
        )}
        {!isLoading && !glossary && (
          <p className="flex items-start gap-1.5 rounded-sm bg-white px-3 py-2 text-xs leading-5 text-gray-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {intl.formatMessage({
              id: !status?.enabled
                ? 'ai.notConfigured'
                : ingesting
                  ? 'papers.ingest.processing'
                  : 'glossary.empty',
            })}
          </p>
        )}
        {glossary?.terms.map((item) => (
          <article
            key={item.term}
            className="rounded-sm border border-gray-200 bg-white p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 break-words text-xs font-semibold text-gray-900">
                {item.term}
              </h3>
              {item.page !== null && (
                <button
                  type="button"
                  onClick={() => onJumpToPage(item.page as number)}
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--office-blue)] hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  {intl.formatMessage(
                    { id: 'ai.paper.page' },
                    { page: item.page },
                  )}
                </button>
              )}
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              {item.explanation}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
