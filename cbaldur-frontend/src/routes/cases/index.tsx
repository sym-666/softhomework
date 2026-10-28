import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/shadcn/components/ui/card';
import { Button } from '@/shadcn/components/ui/button';
import { Badge } from '@/shadcn/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shadcn/components/ui/pagination';
import {
  useGetCasesQuery,
  useLazyGetCaseQuery,
  type CaseListItem,
} from '@/redux/api/case';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';
import { toast } from 'sonner';
import { useAppDispatch } from '@/redux/hooks';
import {
  resetConfig,
  setConfigData,
  type DynamicFormData,
} from '@/redux/slices/dynamicFormSlice';
import { setCurrentConfig } from '@/redux/slices/navigationSlice';

import { Ban, CheckCircle2, XCircle } from 'lucide-react';

interface CaseData extends CaseListItem {
  runTime?: string;
  formattedCreatedAt?: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const renderCaseStatusBadge = (status: string, intl: IntlShape) => {
  switch (status) {
    case 'running':
      return (
        <Badge
          variant="secondary"
          className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1.5 py-0.5 px-2 font-medium"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
          </span>
          <span>{intl.formatMessage({ id: 'cases.status.running' })}</span>
        </Badge>
      );
    case 'success':
      return (
        <Badge
          variant="default"
          className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium py-0.5 px-2 flex items-center gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>{intl.formatMessage({ id: 'cases.status.success' })}</span>
        </Badge>
      );
    case 'terminated':
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 font-medium py-0.5 px-2 flex items-center gap-1"
        >
          <Ban className="h-3 w-3" />
          <span>{intl.formatMessage({ id: 'cases.status.terminated' })}</span>
        </Badge>
      );
    case 'error':
    case 'failed':
    default:
      return (
        <Badge
          variant="destructive"
          className="font-medium py-0.5 px-2 flex items-center gap-1"
        >
          <XCircle className="h-3 w-3" />
          <span>{intl.formatMessage({ id: 'cases.status.error' })}</span>
        </Badge>
      );
  }
};

const DEFAULT_CONFIG_NAME = 'baldur';

export default function Cases() {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const { data: casesData, isLoading, error } = useGetCasesQuery({});
  const [fetchCase] = useLazyGetCaseQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [, setLocation] = useLocation();

  // 表头与每行的估算高度（px），用于按容器高度推算可容纳的行数
  const HEADER_HEIGHT = 41; // h-10 (40px) + 底部边框
  const ROW_HEIGHT = 49; // p-2 (16px) + h-8 按钮 (32px) + 边框
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const recalc = () => {
      const available = el.clientHeight - HEADER_HEIGHT;
      const rows = Math.max(1, Math.floor(available / ROW_HEIGHT));
      setPageSize((prev) => (prev === rows ? prev : rows));
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading, error]);

  const processedData = useMemo(() => {
    if (!casesData) return [];

    return casesData.map((item: CaseData) => ({
      ...item,
      runTime: (
        (new Date(item.updatedAt).getTime() -
          new Date(item.createdAt).getTime()) /
        1000
      ).toFixed(3),
      formattedCreatedAt: formatDate(item.createdAt),
    }));
  }, [casesData]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  // pageSize 变化（容器尺寸变动）后，确保当前页仍在有效范围内
  useLayoutEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleCreateFromTemplate = async (row: CaseData) => {
    if (row.jsonOrNamelist) {
      handleNewWith(true, row.id);
      return;
    }

    try {
      const detail = await fetchCase(row.id).unwrap();
      const prototype = detail.caseJsonPrototype;
      if (!prototype) {
        toast.error('模板数据不可用，无法以此为模板新建');
        return;
      }
      handleNewWith(false, prototype);
    } catch {
      toast.error('加载模板失败，请稍后重试');
    }
  };

  const handleNewWith = (
    jsonOrNamelist: boolean,
    jsonProtypeOrNamelistPrototype: string,
  ) => {
    if (jsonOrNamelist) {
      setLocation(
        `/add-cases/namelist?caseId=${jsonProtypeOrNamelistPrototype}`,
      );
      return;
    }

    const prototype = jsonProtypeOrNamelistPrototype;

    let parsed: DynamicFormData[string];
    try {
      parsed = JSON.parse(prototype);
    } catch {
      toast.error('模板数据格式错误，无法以此为模板新建');
      return;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      toast.error('模板数据格式错误，无法以此为模板新建');
      return;
    }

    dispatch(resetConfig({ configName: DEFAULT_CONFIG_NAME }));
    dispatch(
      setConfigData({
        configName: DEFAULT_CONFIG_NAME,
        data: parsed,
      }),
    );
    dispatch(
      setCurrentConfig({
        name: DEFAULT_CONFIG_NAME,
        totalPanels: 0,
      }),
    );
    setLocation(`/add-cases/dynamic/${DEFAULT_CONFIG_NAME}/0`);
  };

  const handleViewDetails = (userId: string, caseUuid: string) => {
    setLocation(`/cases/${userId}/${caseUuid}`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[90vh] flex items-center justify-center">
        <div className="text-lg"><FormattedMessage id="cases.loading" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[90vh] flex items-center justify-center">
        <div className="text-lg text-red-500"><FormattedMessage id="cases.loadError" /></div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      <Card className="w-full flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Table Container - Takes remaining space */}
          <div ref={scrollRef} className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-center">
                    <FormattedMessage id="cases.table.id" />
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    <FormattedMessage id="cases.table.status" />
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    <FormattedMessage id="cases.table.createdAt" />
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    <FormattedMessage id="cases.table.runTime" />
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    <FormattedMessage id="cases.table.tags" />
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    <FormattedMessage id="cases.table.actions" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-center">
                      {row.caseId}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {renderCaseStatusBadge(row.status, intl)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.formattedCreatedAt}
                    </TableCell>
                    <TableCell className="text-center">{row.runTime}</TableCell>
                    <TableCell className="text-center">
                      {row.tags && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {row.tags
                            .split(',')
                            .map((tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag.trim()}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            row.jsonOrNamelist
                              ? false
                              : !row.hasCaseJsonPrototype
                          }
                          onClick={() => void handleCreateFromTemplate(row)}
                        >
                          <FormattedMessage id="cases.button.createFromTemplate" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={!row.userId}
                          onClick={() => row.userId && handleViewDetails(row.userId, row.id)}
                        >
                          <FormattedMessage id="cases.button.viewDetails" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer - Always at bottom */}
          <div className="border-t bg-muted/30 px-6 py-4 flex justify-between items-center shrink-0">
            <div className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'cases.pagination.summary' }, { pageSize, total: processedData.length })}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage >= totalPages
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
