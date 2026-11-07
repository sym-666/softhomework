import { Link } from 'wouter';
import { BookOpen, Play } from 'lucide-react';
import { useIntl } from 'react-intl';
import type { Dashboard } from '@/redux/api/dashboard';
import type { Paper } from '@/types/paper';
import { TONES, hashRatio, toneFor } from '@/utils/palette';

const MAX_SPINES = 16;

function greetingKey(hour: number) {
  if (hour < 12) return 'dashboard.greeting.morning';
  if (hour < 18) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

/** 带刻度的阅读进度尺 */
function ProgressRuler({ done, total }: { done: number; total: number }) {
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <div className="relative h-7">
      <div className="absolute inset-x-0 top-3 h-2 rounded-[1px] bg-[#e7dfcf]" />
      <div
        className="absolute left-0 top-3 h-2 rounded-[1px] bg-[var(--ink)] transition-[width] duration-700"
        style={{ width: `${ratio * 100}%` }}
      />
      {Array.from({ length: Math.max(total, 1) + 1 }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className="absolute top-0 w-px bg-[var(--ink-soft)]/50"
          style={{
            left: `${(index / Math.max(total, 1)) * 100}%`,
            height: index % 5 === 0 ? 10 : 6,
          }}
        />
      ))}
    </div>
  );
}

/** 书架：每篇论文一本书脊，颜色代表研究方向，在读的论文挂着书签 */
function Bookshelf({
  papers,
  readingIds,
}: {
  papers: Paper[];
  readingIds: Set<number>;
}) {
  const intl = useIntl();
  const shown = papers.slice(0, MAX_SPINES);
  return (
    <div>
      <div className="flex h-[188px] items-end gap-[5px] px-1">
        {shown.map((paper) => {
          const tone = TONES[toneFor(paper.tags[0] ?? paper.title)];
          const ratio = hashRatio(paper.title);
          const reading = readingIds.has(paper.id);
          return (
            <Link
              key={paper.id}
              href={`/papers/${paper.id}`}
              title={paper.title}
              className={`group relative flex shrink-0 flex-col items-center justify-between rounded-t-[2px] py-2 text-white shadow-[inset_-3px_0_0_rgba(0,0,0,0.18),inset_2px_0_0_rgba(255,255,255,0.12)] transition-transform duration-200 hover:-translate-y-2 ${tone.solid}`}
              style={{
                height: `${118 + ratio * 62}px`,
                width: `${26 + Math.round(hashRatio(paper.authors) * 10)}px`,
              }}
            >
              <span aria-hidden className="h-px w-[70%] bg-white/45" />
              <span className="line-clamp-1 max-h-[70%] overflow-hidden font-serif text-[11px] leading-none tracking-wide [writing-mode:vertical-rl]">
                {paper.title}
              </span>
              <span className="font-serif text-[9px] text-white/80">
                {String(paper.year).slice(2)}
              </span>
              {reading && (
                <span
                  aria-hidden
                  className="absolute -top-1 right-1 h-9 w-2.5 bg-[var(--vermilion)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]"
                />
              )}
            </Link>
          );
        })}
        {papers.length > MAX_SPINES && (
          <span className="mb-2 ml-1 font-serif text-sm text-[var(--ink-soft)]">
            +{papers.length - MAX_SPINES}
          </span>
        )}
      </div>
      {/* 搁板 */}
      <div className="h-2.5 rounded-[1px] bg-[var(--ink)] shadow-[0_6px_10px_-4px_rgba(31,42,68,0.55)]" />
      <p className="mt-3 text-[11px] text-[var(--ink-soft)]">
        {intl.formatMessage(
          { id: 'dashboard.shelf.caption' },
          { count: papers.length },
        )}
      </p>
    </div>
  );
}

export function WelcomeHero({
  username,
  data,
  papers,
}: {
  username?: string;
  data: Dashboard;
  papers: Paper[];
}) {
  const intl = useIntl();
  const now = new Date();
  const next = data.continueReading[0];
  const readingIds = new Set(data.continueReading.map((item) => item.paperId));
  const percent =
    data.totalPapers > 0 ? Math.round((data.done / data.totalPapers) * 100) : 0;
  const emphasis = (value: number) => (
    <strong className="font-serif text-[17px] font-semibold text-[var(--vermilion)]">
      {value}
    </strong>
  );

  return (
    <section className="paper-ruled relative overflow-hidden rounded-sm border border-[var(--rule)]">
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <div className="border-[var(--rule)] p-7 lg:border-r">
          <div className="flex items-baseline justify-between text-[11px] tracking-[0.25em] text-[var(--ink-soft)]">
            <span>{intl.formatMessage({ id: 'dashboard.hero.journal' })}</span>
            <span className="font-serif tracking-normal">
              {intl.formatMessage(
                { id: 'dashboard.hero.issue' },
                { number: dayOfYear(now) },
              )}
            </span>
          </div>
          {/* 报头双线 */}
          <div className="mt-2 h-[5px] border-y border-t-2 border-[var(--ink)]" />
          <p className="mt-3 font-serif text-sm text-[var(--ink-soft)]">
            {new Intl.DateTimeFormat(intl.locale, { dateStyle: 'full' }).format(
              now,
            )}
          </p>
          <h1 className="mt-1 font-serif text-[34px] font-bold leading-tight text-[var(--ink)]">
            {intl.formatMessage(
              { id: greetingKey(now.getHours()) },
              { name: username ?? '' },
            )}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
            {intl.formatMessage(
              { id: 'dashboard.hero.summary' },
              {
                due: emphasis(data.dueCards),
                done: emphasis(data.done),
                notes: emphasis(data.notes),
              },
            )}
          </p>

          <div className="mt-5 max-w-md">
            <div className="mb-1 flex items-baseline justify-between text-xs text-[var(--ink-soft)]">
              <span>
                {intl.formatMessage({ id: 'dashboard.hero.progress' })}
              </span>
              <span>
                <span className="font-serif text-base font-semibold text-[var(--ink)]">
                  {percent}%
                </span>
                <span className="ml-2">
                  {intl.formatMessage(
                    { id: 'dashboard.hero.progressHint' },
                    { done: data.done, total: data.totalPapers },
                  )}
                </span>
              </span>
            </div>
            <ProgressRuler done={data.done} total={data.totalPapers} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {next && (
              <Link
                href={`/papers/${next.paperId}`}
                className="inline-flex max-w-full items-center gap-2 rounded-sm bg-[var(--ink)] px-4 py-2 text-sm text-[#f7f3ea] transition-colors hover:bg-[#2b3a5e]"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="shrink-0">
                  {intl.formatMessage({ id: 'dashboard.hero.continue' })}
                </span>
                <span className="truncate font-serif italic text-[#d9d2c3]">
                  {next.title}
                </span>
              </Link>
            )}
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-sm border border-[var(--vermilion)] px-4 py-2 text-sm text-[var(--vermilion)] transition-colors hover:bg-[var(--vermilion)] hover:text-white"
            >
              <Play className="h-4 w-4" />
              {intl.formatMessage({ id: 'dashboard.hero.review' })}
              {data.dueCards > 0 && (
                <span className="font-serif font-semibold">
                  {data.dueCards}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="p-7">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold text-[var(--ink)]">
              {intl.formatMessage({ id: 'dashboard.shelf.title' })}
            </h2>
            <Link
              href="/papers"
              className="text-xs text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
            >
              {intl.formatMessage({ id: 'dashboard.viewAll' })}
            </Link>
          </div>
          <Bookshelf papers={papers} readingIds={readingIds} />
        </div>
      </div>
    </section>
  );
}
