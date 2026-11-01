import { lazy, Suspense, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { useReadingPage } from '@/hooks/useReadingPage';
import { useDeletePaperMutation, useGetPaperQuery } from '@/redux/api/paper';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shadcn/components/ui/tabs';

// pdf.js 体积较大，只在打开论文时加载
const PdfReader = lazy(() => import('@/components/reader/PdfReader'));

export default function PaperDetail({ id }: { id: string }) {
  const intl = useIntl();
  const [, setLocation] = useLocation();
  const paperId = Number(id);
  const { data: paper, isLoading, isError } = useGetPaperQuery(paperId);
  const { data: user } = useGetCurrentUserQuery();
  const [deletePaper, deleteState] = useDeletePaperMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { page, setPage } = useReadingPage(paperId);

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
      <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-400">
        <Loader2 className="mx-auto mb-2 animate-spin" />
        {intl.formatMessage({ id: 'common.loading' })}
      </div>
    );
  }

  if (isError || !paper) {
    return (
      <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-500">
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
      <div className="shrink-0 border border-gray-200 bg-white px-4 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/papers"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--office-blue)]"
            >
              <ArrowLeft size={13} />
              {intl.formatMessage({ id: 'papers.back' })}
            </Link>
            <h1 className="truncate text-sm font-semibold text-gray-900">
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
          <section className="h-[70vh] min-w-0 flex-1 border border-gray-200 bg-white lg:h-auto">
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
                />
              )}
            </Suspense>
          </section>
        )}

        <aside
          className={`flex min-h-0 flex-col border border-gray-200 bg-white ${
            paper.hasLocalFile ? 'lg:w-[400px] lg:shrink-0' : 'flex-1'
          }`}
        >
          <Tabs defaultValue="info" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="m-2 shrink-0">
              <TabsTrigger value="info">
                {intl.formatMessage({ id: 'papers.tabInfo' })}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="info"
              className="min-h-0 flex-1 overflow-auto px-4 pb-4"
            >
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
