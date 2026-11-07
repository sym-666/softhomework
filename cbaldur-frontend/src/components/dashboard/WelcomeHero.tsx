import { Link } from 'wouter';
import { BookOpen, Library, Play, Sparkles } from 'lucide-react';
import { useIntl } from 'react-intl';
import type { Dashboard } from '@/redux/api/dashboard';

function greetingKey(hour: number) {
  if (hour < 12) return 'dashboard.greeting.morning';
  if (hour < 18) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

/** 阅读完成度圆环 */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="9"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="url(#ring)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        className="transition-[stroke-dashoffset] duration-700"
      />
      <defs>
        <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function WelcomeHero({
  username,
  data,
}: {
  username?: string;
  data: Dashboard;
}) {
  const intl = useIntl();
  const next = data.continueReading[0];
  const percent =
    data.totalPapers > 0 ? Math.round((data.done / data.totalPapers) * 100) : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0b1f4d] via-[#1d4ed8] to-[#0ea5e9] p-6 text-white shadow-lg shadow-blue-900/20">
      <span
        aria-hidden
        className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs ring-1 ring-white/25">
            <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
            PaperPilot
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            {intl.formatMessage(
              { id: greetingKey(new Date().getHours()) },
              { name: username ?? '' },
            )}
          </h1>
          <p className="mt-2 text-sm leading-6 text-blue-50/90">
            {intl.formatMessage(
              { id: 'dashboard.hero.summary' },
              { due: data.dueCards, done: data.done, notes: data.notes },
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {next ? (
              <Link
                href={`/papers/${next.paperId}`}
                className="inline-flex max-w-full items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-md transition-transform hover:-translate-y-0.5"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="shrink-0">
                  {intl.formatMessage({ id: 'dashboard.hero.continue' })}
                </span>
                <span className="truncate text-blue-500/80">{next.title}</span>
              </Link>
            ) : (
              <Link
                href="/papers"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-md transition-transform hover:-translate-y-0.5"
              >
                <Library className="h-4 w-4" />
                {intl.formatMessage({ id: 'dashboard.hero.library' })}
              </Link>
            )}
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/25"
            >
              <Play className="h-4 w-4" />
              {intl.formatMessage({ id: 'dashboard.hero.review' })}
              {data.dueCards > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 text-[11px] leading-5">
                  {data.dueCards}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/20 backdrop-blur">
          <div className="relative">
            <ProgressRing done={data.done} total={data.totalPapers} />
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">
              {percent}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold">
              {intl.formatMessage({ id: 'dashboard.hero.progress' })}
            </p>
            <p className="mt-1 text-xs text-blue-100/80">
              {intl.formatMessage(
                { id: 'dashboard.hero.progressHint' },
                { done: data.done, total: data.totalPapers },
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
