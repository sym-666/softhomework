import { useEffect, useRef } from 'react';
import { FileText, Link2, NotebookPen, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { HIGHLIGHT_COLORS } from '@/components/reader/HighlightLayer';
import {
  useDeleteHighlightMutation,
  useUpdateHighlightMutation,
} from '@/redux/api/highlight';
import { useCreateNoteMutation } from '@/redux/api/note';
import type { Highlight } from '@/types/highlight';

interface HighlightItemProps {
  highlight: Highlight;
  onJumpToPage: (page: number) => void;
  /** 在 PDF 上点击这条高亮时传入，每次新对象都会滚动到这里 */
  focusRequest: { id: number } | null;
}

export function HighlightItem({
  highlight,
  onJumpToPage,
  focusRequest,
}: HighlightItemProps) {
  const intl = useIntl();
  const ref = useRef<HTMLElement | null>(null);
  const [createNote, createState] = useCreateNoteMutation();
  const [updateHighlight] = useUpdateHighlightMutation();
  const [deleteHighlight] = useDeleteHighlightMutation();

  useEffect(() => {
    if (focusRequest) ref.current?.scrollIntoView({ block: 'center' });
  }, [focusRequest]);

  const convertToNote = async () => {
    try {
      const note = await createNote({
        paperId: highlight.paperId,
        content: `> ${highlight.text}`,
        page: highlight.page,
      }).unwrap();
      await updateHighlight({ id: highlight.id, noteId: note.id }).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'notes.saveError' }));
    }
  };

  const remove = async () => {
    try {
      await deleteHighlight(highlight.id).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'highlight.deleteError' }));
    }
  };

  return (
    <article
      ref={ref}
      className={`flex gap-2 rounded-sm border bg-white p-2.5 ${
        focusRequest ? 'border-[var(--office-blue)]' : 'border-gray-200'
      }`}
    >
      <span
        className={`w-1 shrink-0 self-stretch rounded-full ${HIGHLIGHT_COLORS[highlight.color].swatch}`}
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-3 text-xs leading-5 text-gray-700">
          {highlight.text}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-gray-400">
          <button
            type="button"
            onClick={() => onJumpToPage(highlight.page)}
            className="inline-flex items-center gap-1 text-[var(--office-blue)] hover:underline"
          >
            <FileText className="h-3 w-3" />
            {intl.formatMessage(
              { id: 'ai.paper.page' },
              { page: highlight.page },
            )}
          </button>
          <div className="flex shrink-0 items-center gap-1">
            {highlight.noteId === null ? (
              <button
                type="button"
                disabled={createState.isLoading}
                onClick={convertToNote}
                className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-gray-100 hover:text-gray-600"
              >
                <NotebookPen className="h-3 w-3" />
                {intl.formatMessage({ id: 'highlight.toNote' })}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-1">
                <Link2 className="h-3 w-3" />
                {intl.formatMessage({ id: 'highlight.linked' })}
              </span>
            )}
            <button
              type="button"
              title={intl.formatMessage({ id: 'highlight.delete' })}
              aria-label={intl.formatMessage({ id: 'highlight.delete' })}
              onClick={remove}
              className="rounded-sm p-1 hover:bg-gray-100 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
