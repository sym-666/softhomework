import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import PaperAssistant from '@/components/ai/PaperAssistant';
import PaperGlossary from '@/components/ai/PaperGlossary';
import PaperGuide from '@/components/ai/PaperGuide';
import { ExportLink } from '@/components/common/ExportLink';
import { NotesPanel } from '@/components/notes/NotesPanel';
import { IngestStatusNotice } from '@/components/reader/IngestStatusNotice';
import { ReferencesPanel } from '@/components/reader/ReferencesPanel';
import { StudyPanel } from '@/components/study/StudyPanel';
import { useReadingPage } from '@/hooks/useReadingPage';
import {
  useDeletePaperMutation,
  useGetPaperQuery,
  useGetReadingStateQuery,
  useUpdateReadingStateMutation,
} from '@/redux/api/paper';
import {
  useCreateHighlightMutation,
  useGetHighlightsQuery,
} from '@/redux/api/highlight';
import { useGetCurrentUserQuery } from '@/redux/api/user';
import { Button } from '@/shadcn/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shadcn/components/ui/tabs';
import type { Highlight, NewHighlight } from '@/types/highlight';
import type { ReadingStatus } from '@/types/paper';

const INGEST_POLL_MS = 2000;
const READING_STATUSES: ReadingStatus[] = ['unread', 'reading', 'done'];
const NO_HIGHLIGHTS: Highlight[] = [];

// pdf.js 体积较大，只在打开论文时加载
const PdfReader = lazy(() => import('@/components/reader/PdfReader'));

export default function PaperDetail({ id }: { id: string }) {
  const intl = useIntl();
  const [, setLocation] = useLocation();
  const paperId = Number(id);
  const [pollingInterval, setPollingInterval] = useState(0);
  const {
    data: paper,
    isLoading,
    isError,
  } = useGetPaperQuery(paperId, { pollingInterval });
  const { data: user } = useGetCurrentUserQuery();
  const [deletePaper, deleteState] = useDeletePaperMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { page, setPage } = useReadingPage(paperId);
  const search = useSearch();
  const { data: highlights = NO_HIGHLIGHTS } = useGetHighlightsQuery(paperId);
  const [createHighlight] = useCreateHighlightMutation();
  const { data: readingState } = useGetReadingStateQuery(paperId);
  const [updateReadingState] = useUpdateReadingStateMutation();
  const [activeTab, setActiveTab] = useState('chat');
  const [askRequest, setAskRequest] = useState<{ text: string } | null>(null);
  const [noteRequest, setNoteRequest] = useState<{ text: string } | null>(null);
  const [highlightFocus, setHighlightFocus] = useState<{ id: number } | null>(
    null,
  );

  // 从复习页等处跳转过来时直接打开指定页
  useEffect(() => {
    const target = Number(new URLSearchParams(search).get('page'));
    if (Number.isInteger(target) && target > 0) setPage(target);
  }, [search, setPage]);

  // 解析在后台进行，完成前定期刷新状态
  const ingesting =
    paper?.ingestStatus === 'pending' || paper?.ingestStatus === 'processing';
  useEffect(() => {
    setPollingInterval(ingesting ? INGEST_POLL_MS : 0);
  }, [ingesting]);

  const askSelection = (text: string) => {
    setAskRequest({
      text: intl.formatMessage({ id: 'reader.selection.askPrompt' }, { text }),
    });
    setActiveTab('chat');
  };

  const noteSelection = (text: string) => {
    setNoteRequest({ text: `> ${text}\n\n` });
    setActiveTab('notes');
  };

  const addHighlight = async (highlight: NewHighlight) => {
    try {
      await createHighlight({ paperId, ...highlight }).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'highlight.saveError' }));
    }
  };

  const changeStatus = async (status: ReadingStatus) => {
    try {
      await updateReadingState({ paperId, status }).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'papers.statusError' }));
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePaper(paperId).unwrap();
      toast.success(intl.formatMessage({ id: 'papers.deleted' }));
      setLocation('/papers');
    } catch {
      toast.error(intl.formatMessage({ id: 'papers.deleteError' }));
    }
  };

  if (isLoading) {
    return (
      <div className="border border-[var(--rule)] bg-[var(--paper-card)] py-20 text-center text-sm text-gray-400">
        <Loader2 className="mx-auto mb-2 animate-spin" />
        {intl.formatMessage({ id: 'common.loading' })}
      </div>
    );
  }

  if (isError || !paper) {
    return (
      <div className="border border-[var(--rule)] bg-[var(--paper-card)] py-20 text-center text-sm text-gray-500">
        <p>{intl.formatMessage({ id: 'papers.notFound' })}</p>
        <Link
          href="/papers"
          className="mt-2 inline-block text-[var(--office-blue)] hover:underline"
        >
          {intl.formatMessage({ id: 'papers.back' })}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 lg:h-[calc(100vh-122px)]">
      <div className="shrink-0 border border-[var(--rule)] bg-[var(--paper-card)] px-4 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/papers"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--office-blue)]"
            >
              <ArrowLeft size={13} />
              {intl.formatMessage({ id: 'papers.back' })}
            </Link>
            <h1 className="truncate font-serif text-base font-semibold text-[var(--ink)]">
              {paper.title}
            </h1>
            <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
              <UserIcon size={12} className="shrink-0" />
              <span className="truncate">
                {paper.authors} · {paper.year}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {readingState && (
              <Select
                value={readingState.status}
                onValueChange={(value) => changeStatus(value as ReadingStatus)}
              >
                <SelectTrigger
                  size="sm"
                  className="w-24 rounded-sm text-xs"
                  aria-label={intl.formatMessage({ id: 'papers.status' })}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {READING_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="text-xs">
                      {intl.formatMessage({ id: `papers.status.${status}` })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button asChild size="sm" variant="outline" className="rounded-sm">
              <a href={paper.downloadUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                {intl.formatMessage({ id: 'papers.read' })}
              </a>
            </Button>
            {user?.id === paper.createdByUserId && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-sm text-red-600 hover:text-red-700"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 />
                {intl.formatMessage({ id: 'papers.delete' })}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
        {paper.hasLocalFile && (
          <section className="h-[70vh] min-w-0 flex-1 border border-[var(--rule)] bg-[var(--paper-card)] lg:h-auto">
            <Suspense
              fallback={
                <div className="py-20 text-center text-sm text-gray-400">
                  <Loader2 className="mx-auto mb-2 animate-spin" />
                  {intl.formatMessage({ id: 'reader.loading' })}
                </div>
              }
            >
              {page !== null && (
                <PdfReader
                  url={paper.downloadUrl}
                  page={page}
                  onPageChange={setPage}
                  onAskSelection={askSelection}
                  onNoteSelection={noteSelection}
                  highlights={highlights}
                  onHighlight={addHighlight}
                  onHighlightClick={(id) => {
                    setHighlightFocus({ id });
                    setActiveTab('notes');
                  }}
                />
              )}
            </Suspense>
          </section>
        )}

        <aside
          className={`flex min-h-0 flex-col border border-[var(--rule)] bg-[var(--paper-card)] ${
            paper.hasLocalFile ? 'lg:w-[400px] lg:shrink-0' : 'flex-1'
          }`}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* 标签较多，窄屏时换行，避免溢出侧栏 */}
            <TabsList className="m-2 h-auto shrink-0 flex-wrap justify-start">
              <TabsTrigger value="chat">
                {intl.formatMessage({ id: 'papers.tabChat' })}
              </TabsTrigger>
              <TabsTrigger value="guide">
                {intl.formatMessage({ id: 'papers.tabGuide' })}
              </TabsTrigger>
              <TabsTrigger value="notes">
                {intl.formatMessage({ id: 'papers.tabNotes' })}
              </TabsTrigger>
              <TabsTrigger value="study">
                {intl.formatMessage({ id: 'papers.tabStudy' })}
              </TabsTrigger>
              <TabsTrigger value="glossary">
                {intl.formatMessage({ id: 'papers.tabGlossary' })}
              </TabsTrigger>
              <TabsTrigger value="references">
                {intl.formatMessage({ id: 'papers.tabReferences' })}
              </TabsTrigger>
              <TabsTrigger value="info">
                {intl.formatMessage({ id: 'papers.tabInfo' })}
              </TabsTrigger>
            </TabsList>
            {/* forceMount：默认切走标签会卸载组件，对话记录、生成中的导读和未保存的笔记就丢了 */}
            <TabsContent
              forceMount
              value="chat"
              className="min-h-0 flex-1 px-2 pb-2 data-[state=inactive]:hidden"
            >
              <PaperAssistant
                paperId={paper.id}
                ingestStatus={paper.ingestStatus}
                onJumpToPage={setPage}
                draftRequest={askRequest}
                currentPage={paper.hasLocalFile ? page : null}
              />
            </TabsContent>
            <TabsContent
              forceMount
              value="guide"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <PaperGuide
                paperId={paper.id}
                ingestStatus={paper.ingestStatus}
              />
            </TabsContent>
            <TabsContent
              forceMount
              value="notes"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <NotesPanel
                paperId={paper.id}
                currentPage={paper.hasLocalFile ? page : null}
                onJumpToPage={setPage}
                draftRequest={noteRequest}
                highlightFocus={highlightFocus}
              />
            </TabsContent>
            <TabsContent
              forceMount
              value="study"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <StudyPanel
                paperId={paper.id}
                ingestStatus={paper.ingestStatus}
                onJumpToPage={setPage}
              />
            </TabsContent>
            <TabsContent
              value="glossary"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <PaperGlossary
                paperId={paper.id}
                ingestStatus={paper.ingestStatus}
                onJumpToPage={setPage}
              />
            </TabsContent>
            <TabsContent
              value="references"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <ReferencesPanel paperId={paper.id} />
            </TabsContent>
            <TabsContent
              value="info"
              className="min-h-0 flex-1 overflow-auto px-4 pb-4"
            >
              <IngestStatusNotice
                paperId={paper.id}
                status={paper.ingestStatus}
                canRetry={user?.id === paper.createdByUserId}
              />
              {!paper.hasLocalFile && (
                <p className="mb-3 rounded-sm bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                  {intl.formatMessage({ id: 'papers.externalOnly' })}
                </p>
              )}
              <h2 className="text-sm font-semibold text-gray-900">
                {intl.formatMessage({ id: 'papers.abstract' })}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {paper.abstract ||
                  intl.formatMessage({ id: 'papers.noAbstract' })}
              </p>
              {paper.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {paper.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <ExportLink
                href={`/api/Papers/${paper.id}/bibtex`}
                label={intl.formatMessage({ id: 'export.bibtex' })}
                className="mt-3 h-7 text-xs"
              />
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-sm">
          <DialogHeader>
            <DialogTitle>
              {intl.formatMessage({ id: 'papers.deleteTitle' })}
            </DialogTitle>
            <DialogDescription>
              {intl.formatMessage(
                { id: 'papers.deleteDescription' },
                { title: paper.title },
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {intl.formatMessage({ id: 'common.cancel' })}
            </Button>
            <Button
              disabled={deleteState.isLoading}
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteState.isLoading && <Loader2 className="animate-spin" />}
              {intl.formatMessage({ id: 'papers.delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
