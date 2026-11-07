import { useState, type ReactNode } from 'react';
import { Check, FileText, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { useDeleteNoteMutation, useUpdateNoteMutation } from '@/redux/api/note';
import { Button } from '@/shadcn/components/ui/button';
import { Textarea } from '@/shadcn/components/ui/textarea';
import type { Note } from '@/types/note';

interface NoteItemProps {
  note: Note;
  /** 提供时页码可以点击跳转 */
  onJumpToPage?: (page: number) => void;
  /** 显示在内容上方，例如论文标题 */
  header?: ReactNode;
}

export function NoteItem({ note, onJumpToPage, header }: NoteItemProps) {
  const intl = useIntl();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updateNote, updateState] = useUpdateNoteMutation();
  const [deleteNote, deleteState] = useDeleteNoteMutation();

  const save = async () => {
    if (!draft.trim()) return;
    try {
      await updateNote({
        id: note.id,
        content: draft,
        page: note.page,
      }).unwrap();
      setEditing(false);
    } catch {
      toast.error(intl.formatMessage({ id: 'notes.saveError' }));
    }
  };

  const remove = async () => {
    try {
      await deleteNote(note.id).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'notes.deleteError' }));
      setConfirmingDelete(false);
    }
  };

  const pageLabel =
    note.page !== null &&
    intl.formatMessage({ id: 'ai.paper.page' }, { page: note.page });

  return (
    <article className="rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] p-3">
      {header}
      {editing ? (
        <>
          <Textarea
            value={draft}
            rows={3}
            maxLength={10000}
            aria-label={intl.formatMessage({ id: 'notes.edit' })}
            onChange={(event) => setDraft(event.target.value)}
            className="resize-none text-sm"
          />
          <div className="mt-2 flex justify-end gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                setDraft(note.content);
                setEditing(false);
              }}
            >
              <X />
              {intl.formatMessage({ id: 'common.cancel' })}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 bg-[var(--office-blue)] text-xs"
              disabled={updateState.isLoading || !draft.trim()}
              onClick={save}
            >
              {updateState.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check />
              )}
              {intl.formatMessage({ id: 'notes.save' })}
            </Button>
          </div>
        </>
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
          {note.content}
        </p>
      )}

      {!editing && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-400">
          <div className="flex min-w-0 items-center gap-2">
            {pageLabel &&
              (onJumpToPage ? (
                <button
                  type="button"
                  onClick={() => onJumpToPage(note.page as number)}
                  className="inline-flex items-center gap-1 text-[var(--office-blue)] hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  {pageLabel}
                </button>
              ) : (
                <span>{pageLabel}</span>
              ))}
            <span>{new Date(note.updatedAt).toLocaleString(intl.locale)}</span>
          </div>
          {confirmingDelete ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={deleteState.isLoading}
                onClick={remove}
                className="font-medium text-red-600 hover:underline"
              >
                {intl.formatMessage({ id: 'notes.confirmDelete' })}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="hover:text-gray-600"
              >
                {intl.formatMessage({ id: 'common.cancel' })}
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title={intl.formatMessage({ id: 'notes.edit' })}
                aria-label={intl.formatMessage({ id: 'notes.edit' })}
                onClick={() => setEditing(true)}
                className="rounded-sm p-1 hover:bg-gray-100 hover:text-gray-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title={intl.formatMessage({ id: 'papers.delete' })}
                aria-label={intl.formatMessage({ id: 'papers.delete' })}
                onClick={() => setConfirmingDelete(true)}
                className="rounded-sm p-1 hover:bg-gray-100 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
