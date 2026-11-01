import { useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { useCreatePaperMutation } from '@/redux/api/paper';
import type { GlobalPaper } from '@/types/paper';

/** 把 Semantic Scholar 的检索结果存入论文库，论文库和参考文献共用 */
export function useSaveGlobalPaper() {
  const intl = useIntl();
  const [createPaper] = useCreatePaperMutation();
  const [savingId, setSavingId] = useState<string>();

  const save = async (paper: GlobalPaper) => {
    const url = paper.pdfUrl || paper.url;
    if (!url) {
      toast.error(intl.formatMessage({ id: 'papers.noSource' }));
      return false;
    }
    setSavingId(paper.id);
    try {
      await createPaper({
        title: paper.title,
        authors: paper.authors,
        year: paper.year ?? new Date().getFullYear(),
        abstract: paper.abstract,
        tags: 'Semantic Scholar',
        url,
      }).unwrap();
      toast.success(intl.formatMessage({ id: 'papers.saved' }));
      return true;
    } catch {
      toast.error(intl.formatMessage({ id: 'papers.saveError' }));
      return false;
    } finally {
      setSavingId(undefined);
    }
  };

  return { save, savingId };
}
