import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { Loader2, NotebookPen, Search } from 'lucide-react';
import { useIntl } from 'react-intl';
import { ExportLink } from '@/components/common/ExportLink';
import { NoteItem } from '@/components/notes/NoteItem';
import { useGetMyNotesQuery } from '@/redux/api/note';
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
  const { data, isLoading, isError } = useGetMyNotesQuery({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSearch(input.trim());
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-white px-4 py-3">
        <h1 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <NotebookPen size={17} className="text-[var(--office-blue)]" />
          {intl.formatMessage({ id: 'notes.title' })}
        </h1>
        <form onSubmit={submit} className="flex gap-2">
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
          <ExportLink
            href={`/api/Notes/export?lang=${language}`}
            label={intl.formatMessage({ id: 'export.markdown' })}
            className="h-8"
          />
        </form>
      </div>

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
          {intl.formatMessage({
            id: search ? 'notes.noResults' : 'notes.emptyAll',
          })}
        </div>
      )}

      <div className="space-y-2">
        {data?.items.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            header={
              <Link
                href={`/papers/${note.paperId}`}
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
    </div>
  );
}
