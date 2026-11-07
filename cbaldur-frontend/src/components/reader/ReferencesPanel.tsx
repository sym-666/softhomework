import { useState } from 'react';
import { Check, Globe2, Info, Loader2, Plus } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { useSaveGlobalPaper } from '@/hooks/useSaveGlobalPaper';
import {
  useGetReferencesQuery,
  useLazySearchGlobalPapersQuery,
} from '@/redux/api/paper';
import { Button } from '@/shadcn/components/ui/button';
import type { GlobalPaper, PaperReference } from '@/types/paper';

function ReferenceItem({ reference }: { reference: PaperReference }) {
  const intl = useIntl();
  const [search, searchState] = useLazySearchGlobalPapersQuery();
  const { save, savingId } = useSaveGlobalPaper();
  const [match, setMatch] = useState<GlobalPaper | null | undefined>();
  const [saved, setSaved] = useState(false);

  const lookUp = async () => {
    try {
      const result = await search({
        query: reference.title,
        limit: 1,
      }).unwrap();
      setMatch(result.papers[0] ?? null);
    } catch {
      toast.error(intl.formatMessage({ id: 'papers.searchError' }));
    }
  };

  return (
    <article className="rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] p-2.5">
      <p className="text-xs leading-5 text-gray-700">
        <span className="mr-1 font-semibold text-gray-500">
          [{reference.index}]
        </span>
        {reference.text}
      </p>

      {match === undefined ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={searchState.isFetching}
          onClick={lookUp}
          className="mt-1 h-6 rounded-sm px-1.5 text-[11px] text-[var(--office-blue)]"
        >
          {searchState.isFetching ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Globe2 />
          )}
          {intl.formatMessage({ id: 'refs.lookUp' })}
        </Button>
      ) : match === null ? (
        <p className="mt-1.5 text-[11px] text-gray-400">
          {intl.formatMessage({ id: 'refs.notFound' })}
        </p>
      ) : (
        <div className="mt-1.5 flex items-center justify-between gap-2 rounded-sm bg-indigo-50/60 px-2 py-1.5">
          <p className="min-w-0 text-[11px] leading-4 text-gray-700">
            <span className="line-clamp-2 font-medium">{match.title}</span>
            <span className="block truncate text-gray-500">
              {match.authors}
              {match.year ? ` · ${match.year}` : ''}
            </span>
          </p>
          {saved ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-green-700">
              <Check className="h-3 w-3" />
              {intl.formatMessage({ id: 'refs.saved' })}
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={savingId === match.id}
              onClick={async () => setSaved(await save(match))}
              className="h-6 shrink-0 rounded-sm px-1.5 text-[11px]"
            >
              {savingId === match.id ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Plus />
              )}
              {intl.formatMessage({ id: 'refs.save' })}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

export function ReferencesPanel({ paperId }: { paperId: number }) {
  const intl = useIntl();
  const { data: references, isLoading } = useGetReferencesQuery(paperId);

  return (
    <div className="h-full min-h-0 space-y-2 overflow-y-auto bg-gray-50 p-2">
      {isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">
          {intl.formatMessage({ id: 'common.loading' })}
        </p>
      )}
      {references?.length === 0 && (
        <p className="flex items-start gap-1.5 rounded-sm bg-white px-3 py-2 text-xs leading-5 text-gray-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {intl.formatMessage({ id: 'refs.empty' })}
        </p>
      )}
      {references && references.length > 0 && (
        <p className="px-1 text-[11px] text-gray-500">
          {intl.formatMessage(
            { id: 'refs.count' },
            { count: references.length },
          )}
        </p>
      )}
      {references?.map((reference) => (
        <ReferenceItem key={reference.index} reference={reference} />
      ))}
    </div>
  );
}
