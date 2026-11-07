import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Layers,
  Library,
  Loader2,
  Play,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StepsGuide } from '@/components/common/StepsGuide';
import { StudySession } from '@/components/study/StudySession';
import {
  useGetDueCardsQuery,
  useGetStudySummaryQuery,
  useLazyGetDueCardsQuery,
} from '@/redux/api/study';
import { Button } from '@/shadcn/components/ui/button';
import type { StudyCard, StudySummary } from '@/types/study';

/** 接口返回的是用户时区的日期，不能用 new Date(字符串)，那样会按 UTC 解析 */
const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

function Forecast({ forecast }: { forecast: StudySummary['forecast'] }) {
  const intl = useIntl();
  const peak = Math.max(1, ...forecast.map((day) => day.count));

  return (
    <section className="border border-[var(--rule)] bg-[var(--paper-card)] p-4">
      <h2 className="text-sm font-semibold text-gray-900">
        {intl.formatMessage({ id: 'review.forecast' })}
      </h2>
      <p className="mt-0.5 text-xs text-gray-500">
        {intl.formatMessage({ id: 'review.forecastHint' })}
      </p>
      <ol className="mt-3 flex h-32 items-end gap-1.5">
        {forecast.map((day, index) => (
          <li
            key={day.date}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-[11px] tabular-nums text-gray-600">
              {day.count}
            </span>
            <span
              className={`w-full rounded-t-sm ${
                index === 0 ? 'bg-[var(--office-blue)]' : 'bg-[#c9d1e0]'
              }`}
              style={{
                height: `${Math.max(3, (day.count / peak) * 72)}%`,
              }}
            />
            <span className="truncate text-[11px] text-gray-500">
              {index === 0
                ? intl.formatMessage({ id: 'review.today' })
                : intl.formatDate(parseLocalDate(day.date), {
                    weekday: 'short',
                  })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PaperProgress({
  papers,
  disabled,
  onStart,
}: {
  papers: StudySummary['papers'];
  disabled: boolean;
  onStart: (paperId: number) => void;
}) {
  const intl = useIntl();

  return (
    <section className="border border-[var(--rule)] bg-[var(--paper-card)] p-4">
      <h2 className="text-sm font-semibold text-gray-900">
        {intl.formatMessage({ id: 'review.papers' })}
      </h2>
      <ul className="mt-2 divide-y divide-gray-100">
        {papers.map((paper) => (
          <li key={paper.paperId} className="py-2.5">
            <Link
              href={`/papers/${paper.paperId}`}
              title={paper.title}
              className="block truncate text-xs font-medium text-gray-800 hover:text-[var(--office-blue)]"
            >
              {paper.title}
            </Link>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-[var(--office-blue)]"
                style={{ width: `${(paper.mastered / paper.total) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-gray-500">
              <span>
                {intl.formatMessage(
                  { id: 'review.paperProgress' },
                  { mastered: paper.mastered, total: paper.total },
                )}
                {paper.due > 0 &&
                  ` · ${intl.formatMessage(
                    { id: 'review.paperDue' },
                    { due: paper.due },
                  )}`}
              </span>
              {paper.due > 0 && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onStart(paper.paperId)}
                  className="shrink-0 font-medium text-[var(--office-blue)] hover:underline disabled:opacity-40"
                >
                  {intl.formatMessage({ id: 'review.paperStart' })}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ReviewPage() {
  const intl = useIntl();
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useGetDueCardsQuery(
    {},
    { refetchOnMountOrArgChange: true },
  );
  const { data: summary } = useGetStudySummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [loadDueCards] = useLazyGetDueCardsQuery();
  const [session, setSession] = useState<StudyCard[] | null>(null);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasCards = (summary?.total ?? 0) > 0;

  const startPaper = async (paperId: number) => {
    try {
      const result = await loadDueCards({ paperId }).unwrap();
      if (result.items.length > 0) setSession(result.items);
    } catch {
      toast.error(intl.formatMessage({ id: 'review.loadError' }));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-3">
      <PageHeader
        icon={BookOpenCheck}
        tone="rose"
        title={intl.formatMessage({ id: 'review.title' })}
        subtitle={intl.formatMessage({ id: 'review.subtitle' })}
        actions={
          !session &&
          items.length > 0 && (
            <Button
              size="sm"
              className="rounded-sm bg-[var(--vermilion)] text-white hover:bg-[#9c3726]"
              onClick={() => setSession(items)}
            >
              <Play />
              {intl.formatMessage({ id: 'review.start' })}
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          tone="rose"
          label={intl.formatMessage({ id: 'review.stat.due' })}
          value={summary?.due ?? 0}
        />
        <StatCard
          icon={Layers}
          tone="blue"
          label={intl.formatMessage({ id: 'review.stat.learning' })}
          value={(summary?.total ?? 0) - (summary?.mastered ?? 0)}
        />
        <StatCard
          icon={GraduationCap}
          tone="emerald"
          label={intl.formatMessage({ id: 'review.stat.mastered' })}
          value={summary?.mastered ?? 0}
        />
        <StatCard
          icon={BookOpenCheck}
          tone="violet"
          label={intl.formatMessage({ id: 'review.stat.total' })}
          value={summary?.total ?? 0}
        />
      </div>

      {summary && !hasCards ? (
        <section className="border border-[var(--rule)] bg-[var(--paper-card)]">
          <StepsGuide
            title={intl.formatMessage({ id: 'review.guide.title' })}
            steps={[1, 2, 3].map((step) => ({
              title: intl.formatMessage({ id: `review.guide.step${step}` }),
              description: intl.formatMessage({
                id: `review.guide.step${step}Desc`,
              }),
            }))}
            action={
              <Button
                asChild
                size="sm"
                className="rounded-sm bg-[var(--office-blue)]"
              >
                <Link href="/papers">
                  <Library />
                  {intl.formatMessage({ id: 'dashboard.openLibrary' })}
                </Link>
              </Button>
            }
          />
        </section>
      ) : (
        <div className="grid items-start gap-3 lg:grid-cols-[1fr_380px]">
          <section className="min-w-0 border border-[var(--rule)] bg-[var(--paper-card)]">
            {session ? (
              <StudySession
                cards={session}
                showPaper
                onFinish={() => setSession(null)}
                onJumpToSource={(card) =>
                  setLocation(`/papers/${card.paperId}?page=${card.page}`)
                }
              />
            ) : isLoading ? (
              <div className="py-20 text-center text-sm text-gray-400">
                <Loader2 className="mx-auto mb-2 animate-spin" />
                {intl.formatMessage({ id: 'common.loading' })}
              </div>
            ) : isError ? (
              <p className="py-20 text-center text-sm text-red-500">
                {intl.formatMessage({ id: 'review.loadError' })}
              </p>
            ) : total === 0 ? (
              <div className="px-6 py-16 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
                <p className="mt-2 text-sm font-medium text-gray-800">
                  {intl.formatMessage({ id: 'review.allDone' })}
                </p>
                {summary?.nextDueAt && (
                  <p className="mt-1 text-xs text-gray-500">
                    {intl.formatMessage(
                      { id: 'review.nextDue' },
                      {
                        date: intl.formatDate(summary.nextDueAt, {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        }),
                      },
                    )}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {intl.formatMessage({ id: 'review.queue' })}
                  </h2>
                  {total > items.length && (
                    <span className="text-[11px] text-gray-500">
                      {intl.formatMessage(
                        { id: 'review.queueMore' },
                        { shown: items.length, total },
                      )}
                    </span>
                  )}
                </div>
                <ul className="divide-y divide-gray-100">
                  {items.map((card) => (
                    <li key={card.id} className="px-4 py-2.5">
                      <p className="line-clamp-2 text-sm text-gray-800">
                        {card.question}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {intl.formatMessage({
                          id:
                            card.kind === 'quiz'
                              ? 'study.kindQuiz'
                              : 'study.kindFlashcard',
                        })}{' '}
                        · {card.paperTitle}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <div className="space-y-3">
            {summary && <Forecast forecast={summary.forecast} />}
            {summary && summary.papers.length > 0 && (
              <PaperProgress
                papers={summary.papers}
                disabled={session !== null}
                onStart={startPaper}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
