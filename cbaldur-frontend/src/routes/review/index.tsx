import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { BookOpenCheck, Loader2, Play } from 'lucide-react';
import { useIntl } from 'react-intl';
import { StudySession } from '@/components/study/StudySession';
import { useGetDueCardsQuery } from '@/redux/api/study';
import { Button } from '@/shadcn/components/ui/button';
import type { StudyCard } from '@/types/study';

export default function ReviewPage() {
  const intl = useIntl();
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useGetDueCardsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [session, setSession] = useState<StudyCard[] | null>(null);
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-white px-4 py-3">
        <div>
          <h1 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <BookOpenCheck size={17} className="text-[var(--office-blue)]" />
            {intl.formatMessage({ id: 'review.title' })}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {intl.formatMessage({ id: 'review.subtitle' }, { count: total })}
          </p>
        </div>
        {!session && data && data.items.length > 0 && (
          <Button
            size="sm"
            className="rounded-sm bg-[var(--office-blue)]"
            onClick={() => setSession(data.items)}
          >
            <Play />
            {intl.formatMessage({ id: 'review.start' })}
          </Button>
        )}
      </div>

      <div className="border border-gray-200 bg-white">
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
          <div className="py-20 text-center text-sm text-gray-500">
            <p>{intl.formatMessage({ id: 'review.empty' })}</p>
            <Link
              href="/papers"
              className="mt-2 inline-block text-[var(--office-blue)] hover:underline"
            >
              {intl.formatMessage({ id: 'dashboard.openLibrary' })}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data?.items.map((card) => (
              <li key={card.id} className="px-4 py-2.5">
                <p className="line-clamp-2 text-sm text-gray-800">
                  {card.question}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {card.paperTitle}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
