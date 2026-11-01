import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { ExportLink } from '@/components/common/ExportLink';
import { useCreateNoteMutation, useGetPaperNotesQuery } from '@/redux/api/note';
import { useAppSelector } from '@/redux/hooks';
import { Button } from '@/shadcn/components/ui/button';
import { Textarea } from '@/shadcn/components/ui/textarea';
import { NoteItem } from './NoteItem';

interface NotesPanelProps {
  paperId: number;
  /** 当前阅读页，新笔记会记录下来；外链论文为 null */
  currentPage: number | null;
  onJumpToPage: (page: number) => void;
  /** 外部填入输入框的内容；每次传入新对象都会填入一次 */
  draftRequest?: { text: string } | null;
}

export function NotesPanel({
  paperId,
  currentPage,
  onJumpToPage,
  draftRequest,
}: NotesPanelProps) {
  const intl = useIntl();
  const language = useAppSelector((state) => state.locale.locale);
  const { data: notes, isLoading } = useGetPaperNotesQuery(paperId);
  const [createNote, createState] = useCreateNoteMutation();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!draftRequest) return;
    // 追加而不是覆盖：连续摘录时不能丢掉已经写好的内容
    setDraft((current) =>
      current.trim()
        ? `${current.trimEnd()}\n\n${draftRequest.text}`
        : draftRequest.text,
    );
    inputRef.current?.focus();
  }, [draftRequest]);

  const add = async () => {
    const content = draft.trim();
    if (!content) return;
    try {
      await createNote({ paperId, content, page: currentPage }).unwrap();
      setDraft('');
    } catch {
      toast.error(intl.formatMessage({ id: 'notes.saveError' }));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-gray-100 px-2 pb-2">
        <Textarea
          ref={inputRef}
          value={draft}
          rows={3}
          maxLength={10000}
          placeholder={intl.formatMessage({ id: 'notes.placeholder' })}
          aria-label={intl.formatMessage({ id: 'notes.placeholder' })}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              add();
            }
          }}
          className="resize-none text-sm"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {currentPage !== null &&
              intl.formatMessage(
                { id: 'notes.currentPage' },
                { page: currentPage },
              )}
          </span>
          <Button
            type="button"
            size="sm"
            className="h-7 rounded-sm bg-[var(--office-blue)] text-xs"
            disabled={createState.isLoading || !draft.trim()}
            onClick={add}
          >
            {createState.isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Plus />
            )}
            {intl.formatMessage({ id: 'notes.add' })}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-2">
        {isLoading && (
          <p className="py-8 text-center text-sm text-gray-400">
            {intl.formatMessage({ id: 'common.loading' })}
          </p>
        )}
        {notes?.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            {intl.formatMessage({ id: 'notes.empty' })}
          </p>
        )}
        {notes?.map((note) => (
          <NoteItem key={note.id} note={note} onJumpToPage={onJumpToPage} />
        ))}
        {notes && notes.length > 0 && (
          <div className="flex justify-end pt-1">
            <ExportLink
              href={`/api/Notes/export?paperId=${paperId}&lang=${language}`}
              label={intl.formatMessage({ id: 'export.markdown' })}
              className="h-7 text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}
