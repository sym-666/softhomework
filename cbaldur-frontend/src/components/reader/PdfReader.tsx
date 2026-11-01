import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import { useIntl } from 'react-intl';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// worker 由打包器作为独立资源输出，必须与 react-pdf 依赖的 pdfjs-dist 版本一致
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfReaderProps {
  url: string;
}

export default function PdfReader({ url }: PdfReaderProps) {
  const intl = useIntl();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  // url 不变时保持同一个对象，否则 Document 会重新加载
  const file = useMemo(() => ({ url, withCredentials: true }), [url]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const status = (text: string) => (
    <div className="py-20 text-center text-sm text-gray-400">{text}</div>
  );

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col overflow-auto bg-gray-100"
    >
      <Document
        file={file}
        loading={
          <div className="py-20 text-center text-sm text-gray-400">
            <Loader2 className="mx-auto mb-2 animate-spin" />
            {intl.formatMessage({ id: 'reader.loading' })}
          </div>
        }
        error={status(intl.formatMessage({ id: 'reader.loadError' }))}
      >
        {containerWidth > 0 && (
          <Page pageNumber={1} width={containerWidth} loading="" />
        )}
      </Document>
    </div>
  );
}
