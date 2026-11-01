import { useState } from 'react';
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

export default function PaperDetail({ id }: { id: string }) {
  const intl = useIntl();
  const [, setLocation] = useLocation();
  const paperId = Number(id);
  const { data: paper, isLoading, isError } = useGetPaperQuery(paperId);
  const { data: user } = useGetCurrentUserQuery();
  const [deletePaper, deleteState] = useDeletePaperMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    <div className="mx-auto w-full max-w-[1400px] space-y-3">
      <div className="border border-gray-200 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/papers"
              className="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--office-blue)]"
            >
              <ArrowLeft size={13} />
              {intl.formatMessage({ id: 'papers.back' })}
            </Link>
            <h1 className="text-base font-semibold text-gray-900">
              {paper.title}
            </h1>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-500">
              <UserIcon size={12} className="mt-0.5 shrink-0" />
              <span>
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
      </div>

      <div className="border border-gray-200 bg-white px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          {intl.formatMessage({ id: 'papers.abstract' })}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
          {paper.abstract || intl.formatMessage({ id: 'papers.noAbstract' })}
        </p>
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
