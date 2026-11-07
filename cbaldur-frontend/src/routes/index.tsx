import { lazy, Suspense, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  BookCheck,
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  ChevronRight,
  Library,
  Loader2,
  NotebookPen,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { StatCard } from '@/components/common/StatCard';
import { WelcomeHero } from '@/components/dashboard/WelcomeHero';
import { useGetDashboardQuery } from '@/redux/api/dashboard';
import { useGetMyNotesQuery } from '@/redux/api/note';
import { useGetPapersQuery } from '@/redux/api/paper';
import { useGetStudySummaryQuery } from '@/redux/api/study';
import { useGetCurrentUserQuery } from '@/redux/api/user';
import { Button } from '@/shadcn/components/ui/button';
import { TONES, toneFor } from '@/utils/palette';

// ECharts 体积较大，不放进首屏包
const ActivityChart = lazy(
  () => import('@/components/dashboard/ActivityChart'),
);
const TopicChart = lazy(() => import('@/components/dashboard/TopicChart'));

function Panel({
  icon: Icon,
  title,
  action,
  children,
  className = '',
}: {
  icon: typeof BookOpen;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-[var(--rule)] pb-2.5">
        <h2 className="flex items-center gap-2 font-serif text-base font-semibold text-[var(--ink)]">
          <Icon className="h-4 w-4 text-[var(--vermilion)]" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAll({ href }: { href: string }) {
  const intl = useIntl();
  return (
    <Link
      href={href}
      className="inline-flex items-center text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
    >
      {intl.formatMessage({ id: 'dashboard.viewAll' })}
      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/** 未来 7 天每天到期的卡片数 */
function ReviewPlan() {
  const intl = useIntl();
  const { data } = useGetStudySummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const forecast = data?.forecast ?? [];
  const peak = Math.max(1, ...forecast.map((day) => day.count));
  const weekday = new Intl.DateTimeFormat(intl.locale, { weekday: 'short' });

  return (
    <Panel
      icon={CalendarClock}
      title={intl.formatMessage({ id: 'dashboard.reviewPlan' })}
      action={<ViewAll href="/review" />}
    >
      <p className="mb-3 text-xs text-[var(--ink-soft)]">
        {intl.formatMessage({ id: 'dashboard.reviewPlanHint' })}
      </p>
      <div className="flex h-32 items-end gap-2 border-b border-[var(--ink)]/70 pb-0">
        {forecast.map((day, index) => (
          <div
            key={day.date}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="font-serif text-xs font-semibold tabular-nums text-[var(--ink)]">
              {day.count}
            </span>
            <div
              className={`w-full rounded-t-[1px] ${
                index === 0 ? 'bg-[var(--vermilion)]' : 'bg-[var(--ink)]/80'
              }`}
              style={{ height: `${Math.max(6, (day.count / peak) * 88)}px` }}
            />
            <span className="text-[10px] text-[var(--ink-soft)]">
              {index === 0
                ? intl.formatMessage({ id: 'review.today' })
                : weekday.format(new Date(`${day.date}T00:00:00`))}
            </span>
          </div>
        ))}
      </div>
      <Button
        asChild
        size="sm"
        className="mt-4 w-full rounded-sm bg-[var(--vermilion)] text-white hover:bg-[#9c3726]"
      >
        <Link href="/review">
          <BookOpenCheck />
          {intl.formatMessage({ id: 'dashboard.reviewNow' })}
          {data && data.due > 0 && ` · ${data.due}`}
        </Link>
      </Button>
    </Panel>
  );
}

function RecentNotes() {
  const intl = useIntl();
  const { data } = useGetMyNotesQuery(
    { page: 1, pageSize: 4 },
    { refetchOnMountOrArgChange: true },
  );
  const notes = data?.items ?? [];

  return (
    <Panel
      icon={NotebookPen}
      title={intl.formatMessage({ id: 'dashboard.recentNotes' })}
      action={<ViewAll href="/notes" />}
    >
      {notes.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--ink-soft)]">
          {intl.formatMessage({ id: 'dashboard.noNotes' })}
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/papers/${note.paperId}${note.page ? `?page=${note.page}` : ''}`}
                className="block border-l-2 border-[var(--ochre)] bg-[#faf6ec] px-3 py-2 transition-colors hover:bg-[#f4ecda]"
              >
                <p className="line-clamp-2 font-serif text-[13px] leading-6 text-[var(--ink)]">
                  {note.content.replace(/^>\s?/gm, '')}
                </p>
                <p className="mt-1 truncate text-[11px] italic text-[var(--ink-soft)]">
                  {note.paperTitle}
                  {note.page
                    ? ` · ${intl.formatMessage({ id: 'ai.paper.page' }, { page: note.page })}`
                    : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function Home() {
  const intl = useIntl();
  const { data, isLoading, isError } = useGetDashboardQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: user } = useGetCurrentUserQuery();
  const { data: library } = useGetPapersQuery({ page: 1, pageSize: 50 });

  if (isLoading) {
    return (
      <div className="rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] py-20 text-center text-sm text-[var(--ink-soft)]">
        <Loader2 className="mx-auto mb-2 animate-spin" />
        {intl.formatMessage({ id: 'common.loading' })}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-sm border border-red-100 bg-[var(--paper-card)] py-20 text-center text-sm text-red-600">
        {intl.formatMessage({ id: 'dashboard.loadError' })}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4">
      <WelcomeHero
        username={user?.username}
        data={data}
        papers={library?.items ?? []}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={Library}
          tone="blue"
          label={intl.formatMessage({ id: 'dashboard.totalPapers' })}
          value={data.totalPapers}
          href="/papers"
        />
        <StatCard
          icon={BookOpen}
          tone="cyan"
          label={intl.formatMessage({ id: 'dashboard.reading' })}
          value={data.reading}
        />
        <StatCard
          icon={BookCheck}
          tone="emerald"
          label={intl.formatMessage({ id: 'dashboard.done' })}
          value={data.done}
        />
        <StatCard
          icon={NotebookPen}
          tone="violet"
          label={intl.formatMessage({ id: 'dashboard.notes' })}
          value={data.notes}
          href="/notes"
        />
        <StatCard
          icon={BookOpenCheck}
          tone="rose"
          label={intl.formatMessage({ id: 'dashboard.dueCards' })}
          value={data.dueCards}
          href="/review"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel
          icon={TrendingUp}
          title={intl.formatMessage({ id: 'dashboard.activity' })}
        >
          <Suspense fallback={<div className="h-[260px]" />}>
            <ActivityChart activity={data.activity} />
          </Suspense>
        </Panel>
        <Panel
          icon={PieChart}
          title={intl.formatMessage({ id: 'dashboard.topics' })}
        >
          <Suspense fallback={<div className="h-[260px]" />}>
            <TopicChart papers={library?.items ?? []} />
          </Suspense>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          icon={BookOpen}
          title={intl.formatMessage({ id: 'dashboard.continueReading' })}
          action={<ViewAll href="/papers" />}
        >
          {data.continueReading.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              <p>{intl.formatMessage({ id: 'dashboard.nothingInProgress' })}</p>
              <Button
                asChild
                size="sm"
                className="mt-3 rounded-sm bg-[var(--ink)]"
              >
                <Link href="/papers">
                  <Library />
                  {intl.formatMessage({ id: 'dashboard.openLibrary' })}
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.continueReading.map((item) => {
                const tone = TONES[toneFor(item.title)];
                return (
                  <li key={item.paperId}>
                    <Link
                      href={`/papers/${item.paperId}`}
                      className="group flex items-center gap-3 rounded-sm px-1 py-1.5 transition-colors hover:bg-[#f4ecda]/70"
                    >
                      <span
                        className={`relative h-11 w-2.5 shrink-0 rounded-[1px] ${tone.solid}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-sm font-semibold text-[var(--ink)] group-hover:underline">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-[var(--ink-soft)]">
                          {intl.formatMessage(
                            { id: 'ai.paper.page' },
                            { page: item.lastPage },
                          )}{' '}
                          · {item.authors}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--rule)] group-hover:text-[var(--ink)]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <ReviewPlan />
        <RecentNotes />
      </div>
    </div>
  );
}
