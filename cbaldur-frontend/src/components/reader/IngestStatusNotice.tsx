import { CheckCircle2, Loader2, RotateCw, TriangleAlert } from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { useRetryIngestionMutation } from '@/redux/api/paper';
import { Button } from '@/shadcn/components/ui/button';
import type { IngestStatus } from '@/types/paper';

interface IngestStatusNoticeProps {
  paperId: number;
  status: IngestStatus;
  canRetry: boolean;
}

export function IngestStatusNotice({
  paperId,
  status,
  canRetry,
}: IngestStatusNoticeProps) {
  const intl = useIntl();
  const [retryIngestion, retryState] = useRetryIngestionMutation();

  if (status === 'none') return null;

  const retry = async () => {
    try {
      await retryIngestion(paperId).unwrap();
    } catch {
      toast.error(intl.formatMessage({ id: 'papers.ingest.retryError' }));
    }
  };

  if (status === 'pending' || status === 'processing') {
    return (
      <p className="mb-3 flex items-center gap-1.5 rounded-sm bg-[var(--office-blue-light)] px-3 py-2 text-xs text-[var(--office-blue)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {intl.formatMessage({ id: 'papers.ingest.processing' })}
      </p>
    );
  }

  if (status === 'ready') {
    return (
      <p className="mb-3 flex items-center gap-1.5 rounded-sm bg-green-50 px-3 py-2 text-xs text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {intl.formatMessage({ id: 'papers.ingest.ready' })}
      </p>
    );
  }

  return (
    <div className="mb-3 rounded-sm bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
      <p className="flex items-start gap-1.5">
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {intl.formatMessage({
          id: status === 'no_text' ? 'papers.ingest.noText' : 'papers.ingest.failed',
        })}
      </p>
      {canRetry && status === 'failed' && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={retryState.isLoading}
          onClick={retry}
          className="mt-2 h-7 rounded-sm text-xs"
        >
          <RotateCw />
          {intl.formatMessage({ id: 'papers.ingest.retry' })}
        </Button>
      )}
    </div>
  );
}
