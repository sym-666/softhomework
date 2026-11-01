import { useState } from 'react';
import { CheckCircle2, FileText, RotateCcw, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { useReviewCardMutation } from '@/redux/api/study';
import { Button } from '@/shadcn/components/ui/button';
import type { StudyCard } from '@/types/study';

interface StudySessionProps {
  /** 开始时的快照：作答会让列表刷新，练习中途题目不能变 */
  cards: StudyCard[];
  onFinish: () => void;
  onJumpToSource: (card: StudyCard) => void;
  /** 跨论文复习时显示题目来自哪篇论文 */
  showPaper?: boolean;
}

export function StudySession({
  cards,
  onFinish,
  onJumpToSource,
  showPaper = false,
}: StudySessionProps) {
  const intl = useIntl();
  const [reviewCard] = useReviewCardMutation();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const card = cards[index];

  const record = async (target: StudyCard, correct: boolean) => {
    if (correct) setCorrectCount((count) => count + 1);
    try {
      await reviewCard({ id: target.id, correct }).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'study.reviewError' }));
    }
  };

  const next = () => {
    setPicked(null);
    setRevealed(false);
    setIndex((current) => current + 1);
  };

  if (!card) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-medium text-gray-800">
          {intl.formatMessage({ id: 'study.finished' })}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {intl.formatMessage(
            { id: 'study.score' },
            { correct: correctCount, total: cards.length },
          )}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4 rounded-sm"
          onClick={onFinish}
        >
          <RotateCcw />
          {intl.formatMessage({ id: 'study.back' })}
        </Button>
      </div>
    );
  }

  const source = card.page !== null && (
    <button
      type="button"
      onClick={() => onJumpToSource(card)}
      className="inline-flex items-center gap-1 text-xs text-[var(--office-blue)] hover:underline"
    >
      <FileText className="h-3 w-3" />
      {intl.formatMessage({ id: 'ai.paper.page' }, { page: card.page })}
    </button>
  );

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {intl.formatMessage(
            { id: 'study.progress' },
            { current: index + 1, total: cards.length },
          )}
        </span>
        <span>
          {intl.formatMessage({
            id: card.kind === 'quiz' ? 'study.kindQuiz' : 'study.kindFlashcard',
          })}
        </span>
      </div>
      {showPaper && (
        <p className="truncate text-xs text-gray-500">{card.paperTitle}</p>
      )}
      <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-gray-900">
        {card.question}
      </p>

      {card.kind === 'quiz' ? (
        <>
          <div className="space-y-1.5">
            {card.options.map((option) => {
              const isAnswer = option === card.answer;
              const state =
                picked === null
                  ? 'border-gray-200 hover:border-[var(--office-blue)]'
                  : isAnswer
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : option === picked
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-400';
              return (
                <button
                  key={option}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => {
                    setPicked(option);
                    record(card, isAnswer);
                  }}
                  className={`flex w-full items-start gap-2 rounded-sm border px-3 py-2 text-left text-sm ${state}`}
                >
                  {picked !== null && isAnswer && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  {picked === option && !isAnswer && (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="space-y-2">
              {card.explanation && (
                <p className="rounded-sm bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                  {card.explanation}
                </p>
              )}
              <div className="flex items-center justify-between">
                {source || <span />}
                <Button
                  type="button"
                  size="sm"
                  className="h-7 rounded-sm bg-[var(--office-blue)] text-xs"
                  onClick={next}
                >
                  {intl.formatMessage({ id: 'study.next' })}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : revealed ? (
        <div className="space-y-2">
          <p className="whitespace-pre-wrap rounded-sm bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-700">
            {card.answer}
          </p>
          {source}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 rounded-sm text-xs"
              onClick={() => {
                record(card, false);
                next();
              }}
            >
              {intl.formatMessage({ id: 'study.forgot' })}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 rounded-sm bg-[var(--office-blue)] text-xs"
              onClick={() => {
                record(card, true);
                next();
              }}
            >
              {intl.formatMessage({ id: 'study.remembered' })}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 rounded-sm text-xs"
          onClick={() => setRevealed(true)}
        >
          {intl.formatMessage({ id: 'study.reveal' })}
        </Button>
      )}
    </div>
  );
}
