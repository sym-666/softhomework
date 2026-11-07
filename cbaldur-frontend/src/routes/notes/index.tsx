import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import {
  CalendarDays,
  Files,
  Highlighter,
  Library,
  Loader2,
  NotebookPen,
  Search,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { ExportLink } from '@/components/common/ExportLink';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StepsGuide } from '@/components/common/StepsGuide';
import { NoteItem } from '@/components/notes/NoteItem';
import { useGetMyNotesQuery, useGetNoteSummaryQuery } from '@/redux/api/note';
import { useAppSelector } from '@/redux/hooks';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';

const PAGE_SIZE = 20;

export default function NotesPage() {
  const intl = useIntl();
  const language = useAppSelector((state) => state.locale.locale);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [paperId, setPaperId] = useState<number>();
  const { data: summary } = useGetNoteSummaryQuery(undefined, {
    // 高亮不走笔记的缓存标签，回到这里时要重新统计
    refetchOnMountOrArgChange: true,
  });
  const { data, isLoading, isError } = useGetMyNotesQuery({
    search: search || undefined,
    paperId,
    page,
    pageSize: PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const hasNotes = (summary?.total ?? 0) > 0;

  // 这篇论文的笔记删完后，筛选项已经不存在
  useEffect(() => {
    if (
      paperId !== undefined &&
      summary &&
      !summary.papers.some((paper) => paper.paperId === paperId)
    ) {
      setPaperId(undefined);
    }
  }, [paperId, summary]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSearch(input.trim());
    setPage(1);
  };

  const selectPaper = (id?: number) => {
    setPaperId(id);
    setPage(1);
  };

  const filterClass = (active: boolean) =>
    `flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-xs ${
      active
        ? 'bg-blue-50 font-medium text-[var(--office-blue)]'
        : 'text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-3">
      <PageHeader
        icon={NotebookPen}
        tone="violet"
        title={intl.formatMessage({ id: 'notes.title' })}
        subtitle={intl.formatMessage({ id: 'notes.subtitle' })}
        actions={
          <form onSubmit={submit} className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={intl.formatMessage({ id: 'notes.search' })}
                className="h-8 w-56 rounded-sm pl-8 text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-8 rounded-sm"
            >
              {intl.formatMessage({ id: 'papers.search' })}
            </Button>
            {hasNotes && (
              <ExportLink
                href={`/api/Notes/export?lang=${language}${
                  paperId ? `&paperId=${paperId}` : ''
                }`}
                label={intl.formatMessage({ id: 'export.markdown' })}
                className="h-8"
              />
            )}
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={NotebookPen}
          tone="violet"
          label={intl.formatMessage({ id: 'notes.stat.total' })}
          value={summary?.total ?? 0}
        />
        <StatCard
          icon={Files}
          tone="blue"
          label={intl.formatMessage({ id: 'notes.stat.papers' })}
          value={summary?.papers.length ?? 0}
        />
        <StatCard
          icon={CalendarDays}
          tone="emerald"
          label={intl.formatMessage({ id: 'notes.stat.recent' })}
          value={summary?.recent ?? 0}
        />
        <StatCard
          icon={Highlighter}
          tone="amber"
          label={intl.formatMessage({ id: 'notes.stat.highlights' })}
          value={summary?.highlights ?? 0}
        />
      </div>

      {summary && !hasNotes ? (
        <section className="border border-gray-200 bg-white">
          <StepsGuide
            title={intl.formatMessage({ id: 'notes.guide.title' })}
            steps={[1, 2, 3].map((step) => ({
              title: intl.formatMessage({ id: `notes.guide.step${step}` }),
              description: intl.formatMessage({
                id: `notes.guide.step${step}Desc`,
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
        <div className="grid items-start gap-3 lg:grid-cols-[280px_1fr]">
          <aside className="border border-gray-200 bg-white p-2 lg:sticky lg:top-0">
            <h2 className="px-2.5 pb-1.5 pt-1 text-xs font-semibold text-gray-900">
              {intl.formatMessage({ id: 'notes.filter.title' })}
            </h2>
            <button
              type="button"
              aria-pressed={paperId === undefined}
              className={filterClass(paperId === undefined)}
              onClick={() => selectPaper(undefined)}
            >
              <span>{intl.formatMessage({ id: 'notes.filter.all' })}</span>
              <span className="tabular-nums">{summary?.total ?? 0}</span>
            </button>
            {summary?.papers.map((paper) => (
              <button
                key={paper.paperId}
                type="button"
                title={paper.title}
                aria-pressed={paperId === paper.paperId}
                className={filterClass(paperId === paper.paperId)}
                onClick={() => selectPaper(paper.paperId)}
              >
                <span className="min-w-0 truncate">{paper.title}</span>
                <span className="shrink-0 tabular-nums">{paper.count}</span>
              </button>
            ))}
          </aside>

          <section className="min-w-0">
            {isLoading && (
              <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-400">
                <Loader2 className="mx-auto mb-2 animate-spin" />
                {intl.formatMessage({ id: 'common.loading' })}
              </div>
            )}
            {isError && (
              <div className="border border-red-100 bg-white py-20 text-center text-sm text-red-500">
                {intl.formatMessage({ id: 'notes.loadError' })}
              </div>
            )}
            {data?.items.length === 0 && (
              <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-400">
                {intl.formatMessage({ id: 'notes.noResults' })}
              </div>
            )}

            <div className="grid items-start gap-2 xl:grid-cols-2">
              {data?.items.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  header={
                    <Link
                      href={`/papers/${note.paperId}${
                        note.page ? `?page=${note.page}` : ''
                      }`}
                      className="mb-1 block truncate text-xs font-medium text-[var(--office-blue)] hover:underline"
                    >
                      {note.paperTitle}
                    </Link>
                  }
                />
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-3 border border-gray-200 bg-white p-2 text-xs">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="disabled:opacity-30"
                >
                  {intl.formatMessage({ id: 'common.previous' })}
                </button>
                <span>
                  {page} / {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((value) => value + 1)}
                  className="disabled:opacity-30"
                >
                  {intl.formatMessage({ id: 'common.next' })}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
