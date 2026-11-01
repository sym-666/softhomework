import { lazy, Suspense, type ComponentType } from 'react';
import { Link } from 'wouter';
import {
  BookCheck,
  BookOpen,
  ChevronRight,
  Library,
  Loader2,
  NotebookPen,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { useGetDashboardQuery } from '@/redux/api/dashboard';
import { Button } from '@/shadcn/components/ui/button';

// ECharts 体积较大，不放进首屏包
const ActivityChart = lazy(
  () => import('@/components/dashboard/ActivityChart'),
);

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 border border-gray-200 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-blue-50 text-[var(--office-blue)]">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const intl = useIntl();
  const { data, isLoading, isError } = useGetDashboardQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  if (isLoading) {
    return (
      <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-400">
        <Loader2 className="mx-auto mb-2 animate-spin" />
        {intl.formatMessage({ id: 'common.loading' })}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="border border-red-100 bg-white py-20 text-center text-sm text-red-500">
        {intl.formatMessage({ id: 'dashboard.loadError' })}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Library}
          label={intl.formatMessage({ id: 'dashboard.totalPapers' })}
          value={data.totalPapers}
        />
        <StatCard
          icon={BookOpen}
          label={intl.formatMessage({ id: 'dashboard.reading' })}
          value={data.reading}
        />
        <StatCard
          icon={BookCheck}
          label={intl.formatMessage({ id: 'dashboard.done' })}
          value={data.done}
        />
        <StatCard
          icon={NotebookPen}
          label={intl.formatMessage({ id: 'dashboard.notes' })}
          value={data.notes}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <section className="border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            {intl.formatMessage({ id: 'dashboard.activity' })}
          </h2>
          <Suspense fallback={<div className="h-[260px]" />}>
            <ActivityChart activity={data.activity} />
          </Suspense>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            {intl.formatMessage({ id: 'dashboard.continueReading' })}
          </h2>
          {data.continueReading.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              <p>{intl.formatMessage({ id: 'dashboard.nothingInProgress' })}</p>
              <Button
                asChild
                size="sm"
                className="mt-3 rounded-sm bg-[var(--office-blue)]"
              >
                <Link href="/papers">
                  <Library />
                  {intl.formatMessage({ id: 'dashboard.openLibrary' })}
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.continueReading.map((item) => (
                <li key={item.paperId}>
                  <Link
                    href={`/papers/${item.paperId}`}
                    className="group flex items-center justify-between gap-2 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-gray-800 group-hover:text-[var(--office-blue)]">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {intl.formatMessage(
                          { id: 'ai.paper.page' },
                          { page: item.lastPage },
                        )}{' '}
                        · {item.authors}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
