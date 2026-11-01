import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useGetReadingStateQuery,
  useUpdateReadingStateMutation,
} from '@/redux/api/paper';

const SAVE_DELAY_MS = 800;

/** 恢复并保存上次阅读页码；连续翻页时只保存最后一页 */
export function useReadingPage(paperId: number) {
  const { data, isError } = useGetReadingStateQuery(paperId);
  const [updateReadingState] = useUpdateReadingStateMutation();
  const [page, setPageState] = useState<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const lastPage = pendingRef.current;
    pendingRef.current = null;
    if (lastPage !== null) {
      updateReadingState({ paperId, lastPage }).catch(() => {
        // 保存进度失败不打断阅读，下次翻页会再次保存
      });
    }
  }, [paperId, updateReadingState]);

  useEffect(() => {
    if (data) setPageState((current) => current ?? data.lastPage);
    // 读不到进度时从第一页开始，不能因此打不开论文
    else if (isError) setPageState((current) => current ?? 1);
  }, [data, isError]);

  // 离开页面时保存还没写入的页码
  useEffect(() => flush, [flush]);

  const setPage = useCallback(
    (next: number) => {
      setPageState(next);
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  return { page, setPage };
}
