import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  NotebookPen,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { usePdfSelection } from '@/hooks/usePdfSelection';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import { SelectionAction, SelectionToolbar } from './SelectionToolbar';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// worker 由打包器作为独立资源输出，必须与 react-pdf 依赖的 pdfjs-dist 版本一致
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const PAGE_PADDING = 32;

interface PdfReaderProps {
  url: string;
  /** 当前页码，由父组件控制，AI 引用可以借此跳页 */
  page: number;
  onPageChange: (page: number) => void;
  /** 针对选中文字提问 */
  onAskSelection: (text: string) => void;
  /** 把选中文字记为笔记 */
  onNoteSelection: (text: string) => void;
}

export default function PdfReader({
  url,
  page,
  onPageChange,
  onAskSelection,
  onNoteSelection,
}: PdfReaderProps) {
  const intl = useIntl();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { selection, clear: clearSelection } = usePdfSelection(scrollRef);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pageInput, setPageInput] = useState(String(page));
  // url 不变时保持同一个对象，否则 Document 会重新加载
  const file = useMemo(() => ({ url, withCredentials: true }), [url]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPageInput(String(page));
    scrollRef.current?.scrollTo({ top: 0 });
  }, [page]);

  const goTo = useCallback(
    (target: number) => {
      const last = numPages || target;
      onPageChange(Math.min(Math.max(1, target), last));
    },
    [numPages, onPageChange],
  );

  const handleLoaded = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    // 保存的页码可能超出范围（例如换过文件）
    if (page > total) onPageChange(total);
  };

  const commitPageInput = () => {
    const target = Number.parseInt(pageInput, 10);
    if (Number.isNaN(target)) {
      setPageInput(String(page));
      return;
    }
    goTo(target);
    setPageInput(String(Math.min(Math.max(1, target), numPages || target)));
  };

  const zoom = (delta: number) => {
    setScale((value) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, value + delta)),
    );
  };

  const statusText = (text: string) => (
    <div className="py-20 text-center text-sm text-gray-400">{text}</div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-2 py-1">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            title={intl.formatMessage({ id: 'reader.previousPage' })}
            aria-label={intl.formatMessage({ id: 'reader.previousPage' })}
            onClick={() => goTo(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            value={pageInput}
            inputMode="numeric"
            aria-label={intl.formatMessage({ id: 'reader.pageNumber' })}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={commitPageInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitPageInput();
            }}
            className="h-7 w-12 rounded-sm px-1 text-center text-xs"
          />
          <span>/ {numPages || '-'}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={numPages === 0 || page >= numPages}
            title={intl.formatMessage({ id: 'reader.nextPage' })}
            aria-label={intl.formatMessage({ id: 'reader.nextPage' })}
            onClick={() => goTo(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={scale <= MIN_SCALE}
            title={intl.formatMessage({ id: 'reader.zoomOut' })}
            aria-label={intl.formatMessage({ id: 'reader.zoomOut' })}
            onClick={() => zoom(-SCALE_STEP)}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="w-11 text-center hover:text-[var(--office-blue)]"
            title={intl.formatMessage({ id: 'reader.fitWidth' })}
            onClick={() => setScale(1)}
          >
            {Math.round(scale * 100)}%
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={scale >= MAX_SCALE}
            title={intl.formatMessage({ id: 'reader.zoomIn' })}
            aria-label={intl.formatMessage({ id: 'reader.zoomIn' })}
            onClick={() => zoom(SCALE_STEP)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selection && (
        <SelectionToolbar selection={selection}>
          <SelectionAction
            icon={Sparkles}
            label={intl.formatMessage({ id: 'reader.selection.ask' })}
            onClick={() => {
              onAskSelection(selection.text);
              clearSelection();
            }}
          />
          <SelectionAction
            icon={NotebookPen}
            label={intl.formatMessage({ id: 'reader.selection.note' })}
            onClick={() => {
              onNoteSelection(selection.text);
              clearSelection();
            }}
          />
        </SelectionToolbar>
      )}

      <div
        ref={scrollRef}
        // 选区跟随页面滚动，工具条是固定定位，继续留着会错位
        onScroll={() => selection && clearSelection()}
        className="min-h-0 flex-1 overflow-auto bg-gray-100"
      >
        <Document
          file={file}
          onLoadSuccess={handleLoaded}
          loading={
            <div className="py-20 text-center text-sm text-gray-400">
              <Loader2 className="mx-auto mb-2 animate-spin" />
              {intl.formatMessage({ id: 'reader.loading' })}
            </div>
          }
          error={statusText(intl.formatMessage({ id: 'reader.loadError' }))}
          className="flex w-max min-w-full justify-center p-4"
        >
          {containerWidth > 0 && (
            <Page
              pageNumber={page}
              width={Math.max(containerWidth - PAGE_PADDING, 200) * scale}
              loading=""
              className="shadow"
            />
          )}
        </Document>
      </div>
    </div>
  );
}
