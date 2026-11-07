import { useState } from 'react';
import { Info, Loader2, Play, Sparkles, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { useGetAiStatusQuery } from '@/redux/api/ai';
import {
  useDeleteCardMutation,
  useGenerateCardsMutation,
  useGetPaperCardsQuery,
} from '@/redux/api/study';
import { useAppSelector } from '@/redux/hooks';
import { Button } from '@/shadcn/components/ui/button';
import type { IngestStatus } from '@/types/paper';
import type { StudyCard } from '@/types/study';
import { StudySession } from './StudySession';

interface StudyPanelProps {
  paperId: number;
  ingestStatus: IngestStatus;
  onJumpToPage: (page: number) => void;
}

export function StudyPanel({
  paperId,
  ingestStatus,
  onJumpToPage,
}: StudyPanelProps) {
  const intl = useIntl();
  const language = useAppSelector((state) => state.locale.locale);
  const { data: status } = useGetAiStatusQuery();
  const { data: cards, isLoading } = useGetPaperCardsQuery(paperId);
  const [generateCards, generateState] = useGenerateCardsMutation();
  const [deleteCard] = useDeleteCardMutation();
  const [session, setSession] = useState<StudyCard[] | null>(null);
  const ingesting = ingestStatus === 'pending' || ingestStatus === 'processing';

  const generate = async () => {
    try {
      const created = await generateCards({ paperId, lang: language }).unwrap();
      toast.success(
        intl.formatMessage(
          { id: created.length ? 'study.generated' : 'study.noNewCards' },
          { count: created.length },
        ),
      );
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? intl.formatMessage({ id: 'ai.error' }));
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteCard(id).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'study.deleteError' }));
    }
  };

  if (session) {
    return (
      <div className="h-full overflow-y-auto">
        <StudySession
          cards={session}
          onFinish={() => setSession(null)}
          onJumpToSource={(card) => card.page && onJumpToPage(card.page)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-2 pb-2">
        <p className="min-w-0 truncate text-xs text-gray-500">
          {intl.formatMessage(
            { id: 'study.count' },
            { count: cards?.length ?? 0 },
          )}
        </p>
        <div className="flex shrink-0 gap-1.5">
          {status?.enabled && !ingesting && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={generateState.isLoading}
              onClick={generate}
              className="h-7 rounded-sm text-xs"
            >
              {generateState.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              {intl.formatMessage({
                id: generateState.isLoading
                  ? 'study.generating'
                  : 'study.generate',
              })}
            </Button>
          )}
          {cards && cards.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => setSession(cards)}
              className="h-7 rounded-sm bg-[var(--office-blue)] text-xs"
            >
              <Play />
              {intl.formatMessage({ id: 'study.start' })}
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-2">
        {isLoading && (
          <p className="py-8 text-center text-sm text-gray-400">
            {intl.formatMessage({ id: 'common.loading' })}
          </p>
        )}
        {cards?.length === 0 && (
          <p className="flex items-start gap-1.5 rounded-sm bg-white px-3 py-2 text-xs leading-5 text-gray-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {intl.formatMessage({
              id: status?.enabled ? 'study.empty' : 'ai.notConfigured',
            })}
          </p>
        )}
        {cards?.map((card) => (
          <article
            key={card.id}
            className="flex items-start justify-between gap-2 rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] p-2.5"
          >
            <div className="min-w-0">
              <p className="line-clamp-2 text-xs leading-5 text-gray-700">
                {card.question}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {intl.formatMessage({
                  id:
                    card.kind === 'quiz'
                      ? 'study.kindQuiz'
                      : 'study.kindFlashcard',
                })}
              </p>
            </div>
            <button
              type="button"
              title={intl.formatMessage({ id: 'study.delete' })}
              aria-label={intl.formatMessage({ id: 'study.delete' })}
              onClick={() => remove(card.id)}
              className="shrink-0 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
