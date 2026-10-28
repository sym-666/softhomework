import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useLocation } from 'wouter';
import {
  useGetCaseQuery,
  useGetCasesQuery,
  useGetCaseLogsQuery,
  useTerminateCaseMutation,
} from '@/redux/api/case';
import {
  useGetTimesQuery,
  useLazyGetTimesQuery,
  useGetHeadersQuery,
  useGetPlotQuery,
  useGetPlotWithVariablesMutation,
  useLazyGetPlotQuery,
  useGetPlotAcrossTimesMutation,
  useGetPlotAcrossCasesMutation,
  useDownloadPlotCsvMutation,
  useDownloadPlotCsvAcrossTimesMutation,
  useDownloadPlotCsvAcrossCasesMutation,
} from '@/redux/api/plot';
import { Button } from '@/shadcn/components/ui/button';
import { Badge } from '@/shadcn/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/shadcn/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import { Label } from '@/shadcn/components/ui/label';
import { Input } from '@/shadcn/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shadcn/components/ui/dialog';
import { Progress } from '@/shadcn/components/ui/progress';
import { Switch } from '@/shadcn/components/ui/switch';
import { toast } from 'sonner';
import { FormattedMessage, useIntl } from 'react-intl';
import ReactECharts from 'echarts-for-react';
import type { EChartsInstance } from 'echarts-for-react';
import {
  Download,
  FileSpreadsheet,
  Image,
  RotateCcw,
  Grid3x3,
  Database,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Info,
  Clock,
  Terminal,
  ArrowLeft,
  AlertTriangle,
  OctagonX,
  Ban,
  Server,
  Calendar,
  Timer,
  XCircle,
  FileJson,
  Loader2,
  Bot,
} from 'lucide-react';
import { RibbonGroup } from '@/components/office/RibbonGroup';
import { RibbonButton } from '@/components/office/RibbonButton';
import { useRibbonCollapse } from '@/components/office/RibbonCollapseContext';
import { usePlotTimeAnimation } from '@/hooks/usePlotTimeAnimation';
import { useCaseLogEvents } from '@/hooks/useCaseLogEvents';
import { CaseLogTerminal } from '@/components/cases/CaseLogTerminal';
import { PipelineStepStepper } from '@/components/cases/PipelineStepStepper';
import CaseAssistant from '@/components/ai/CaseAssistant';
import { useGetAiStatusQuery } from '@/redux/api/ai';
import { useAppDispatch } from '@/redux/hooks';
import {
  resetConfig,
  setConfigData,
  type DynamicFormData,
} from '@/redux/slices/dynamicFormSlice';
import { setCurrentConfig } from '@/redux/slices/navigationSlice';
import type { PlotRequest, ProposedFieldChange } from '@/types/Ai';
import {
  buildExpressionVariables,
  evaluateExpression,
  hydrateExpressionVariables,
  parseExpression,
  type ExpressionVariable,
  type ParsedExpression,
} from '@/utils/plotExpression';

interface CaseProps {
  userId: string;
  caseId: string;
}

const getLatestTimeValue = (times: string[]): string | undefined => {
  if (!times || times.length === 0) return undefined;
  return times.reduce((latest, current) => {
    if (!latest) return current;
    const latestTime = Date.parse(latest);
    const currentTime = Date.parse(current);
    if (Number.isNaN(latestTime) || Number.isNaN(currentTime)) return current;
    return currentTime > latestTime ? current : latest;
  }, times[0]);
};

const Case: React.FC<CaseProps> = ({
  userId: userIdStr,
  caseId: caseIdStr,
}) => {
  const userId = userIdStr;
  /** Route param is the case UUID (PK); per-user sequence lives on caseData.caseId */
  const caseId = caseIdStr;
  const intl = useIntl();
  const { collapsed: ribbonCollapsed } = useRibbonCollapse();

  const {
    data: caseData,
    isLoading: isCaseLoading,
    refetch: refetchCase,
  } = useGetCaseQuery(caseId, {
    skip: !caseId,
  });

  const isRunning = caseData?.status === 'running';
  const isFailed =
    caseData?.status === 'failed' || caseData?.status === 'error';
  const isCaseSuccess = caseData?.status === 'success';

  const {
    logs: liveLogs,
    logsByFile: liveLogsByFile,
    availableFiles: liveAvailableFiles,
    status: logStreamStatus,
    isCompleted: isLogCompleted,
    isSuccess: isLogSuccess,
    errorMessage: logErrorMessage,
    reconnect: reconnectLogStream,
    clearLogs: clearLiveLogs,
  } = useCaseLogEvents({
    caseId,
    userId,
    enabled: isRunning,
    initialLogs: historicalLogsData?.logs,
    initialLogsByFile: historicalLogsData?.logsByFile,
    initialFiles: historicalLogsData?.files,
    onCompleted: (success, err) => {
      if (success) {
        toast.success('算例计算完成！正在加载图表...');
        refetchCase();
      } else {
        toast.error(`算例计算失败: ${err || '请查看控制台日志'}`);
        refetchCase();
      }
    },
  });

  const [, setLocation] = useLocation();
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [terminateCaseMutation, { isLoading: isTerminating }] =
    useTerminateCaseMutation();

  const isTerminated = useMemo(() => {
    if (caseData?.status === 'terminated') return true;
    return liveLogs.some(
      (l) =>
        l.includes('主动终止') ||
        l.includes('已被主动终止') ||
        l.includes('已由用户主动终止'),
    );
  }, [caseData?.status, liveLogs]);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!caseData?.createdAt) return;
    const startTime = new Date(caseData.createdAt).getTime();

    const updateTimer = () => {
      const endTime =
        !isRunning && caseData.updatedAt
          ? new Date(caseData.updatedAt).getTime()
          : Date.now();
      const diffSec = Math.max(0, Math.floor((endTime - startTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    if (!isRunning) return;

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [caseData?.createdAt, caseData?.updatedAt, isRunning]);

  const formatElapsed = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const getSupercomputerName = (sc?: string) => {
    if (!sc) return '自动分配';
    if (sc === 'Beijing' || sc.toLowerCase().includes('beijing'))
      return 'BSCC-T 北京超算 (Slurm)';
    if (sc === 'Hubei' || sc.toLowerCase().includes('hubei'))
      return 'MHD@HUST 湖北超算';
    return sc;
  };

  const handleTerminateCase = async () => {
    try {
      const res = await terminateCaseMutation({ id: caseId }).unwrap();
      if (res.success) {
        toast.success('算例计算已成功终止');
        setShowTerminateConfirm(false);
        refetchCase();
      } else {
        toast.error(res.message || '终止算例失败');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || '终止算例请求失败');
    }
  };

  const [showLogModal, setShowLogModal] = useState(false);
  const { data: historicalLogsData, isLoading: isHistoricalLogsLoading } =
    useGetCaseLogsQuery(
      { id: caseId, userId },
      { skip: !caseId || isRunning },
    );

  const displayLogs = useMemo(() => {
    if (liveLogs.length > 0) return liveLogs;
    if (historicalLogsData?.logs) {
      return historicalLogsData.logs.split('\n');
    }
    return [];
  }, [liveLogs, historicalLogsData?.logs]);

  const displayLogsByFile = useMemo(() => {
    if (Object.keys(liveLogsByFile).length > 0) return liveLogsByFile;
    if (historicalLogsData?.logsByFile) {
      const map: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(historicalLogsData.logsByFile)) {
        map[k] = v.split('\n');
      }
      return map;
    }
    return {};
  }, [liveLogsByFile, historicalLogsData?.logsByFile]);

  const displayAvailableFiles = useMemo(() => {
    if (liveAvailableFiles && liveAvailableFiles.length > 1) {
      return liveAvailableFiles;
    }
    if (historicalLogsData?.files && historicalLogsData.files.length > 0) {
      return historicalLogsData.files;
    }
    return ['all'];
  }, [liveAvailableFiles, historicalLogsData?.files]);

  const [nowType, setNowType] = useState('eq1D');
  const [nowMode, setNowMode] = useState('single');
  const [nowTime, setNowTime] = useState<string | undefined>(undefined);
  const [nowX, setNowX] = useState<string | undefined>(undefined);
  const [nowY, setNowY] = useState<string | undefined>(undefined);
  const [plotData, setPlotData] = useState<any[]>([]);
  const [xAxisDomain, setXAxisDomain] = useState<[number, number] | undefined>(
    undefined,
  );
  const [yAxisDomain, setYAxisDomain] = useState<[number, number] | undefined>(
    undefined,
  );
  const [isPlotLoading, setIsPlotLoading] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const [yExpression, setYExpression] = useState<string>('');
  const [appliedExpression, setAppliedExpression] = useState<string>('');
  const [expressionError, setExpressionError] = useState<string>('');
  const [variableToInsert, setVariableToInsert] = useState('');
  const expressionInputRef = useRef<HTMLInputElement | null>(null);

  const [nowTimes, setNowTimes] = useState<string[]>([]);
  const [nowCases, setNowCases] = useState<
    { caseId: string; times: string[] }[]
  >([]);
  const [caseTimesById, setCaseTimesById] = useState<Record<string, string[]>>(
    {},
  );
  const [loadingCaseTimesIds, setLoadingCaseTimesIds] = useState<string[]>([]);
  const loadingCaseTimesRef = useRef<Set<string>>(new Set());
  const nowTypeRef = useRef(nowType);
  nowTypeRef.current = nowType;
  const lastTypeWithTimesRef = useRef<string | null>(null);
  const lastTypeWithHeadersRef = useRef<string | null>(null);

  const [showCaseSummary, setShowCaseSummary] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(false);

  // AI 算例助手：侧边栏开关与待应用的绘图请求
  const { data: aiStatus } = useGetAiStatusQuery();
  const aiEnabled = aiStatus?.enabled === true;
  const [aiOpen, setAiOpen] = useState(false);
  const [pendingPlot, setPendingPlot] = useState<PlotRequest | null>(null);

  const { data: timeOptions, isLoading: isTimesLoading } = useGetTimesQuery(
    { caseId, type: nowType },
    { skip: !caseId || !isCaseSuccess },
  );

  const { data: casesList } = useGetCasesQuery(
    {},
    { skip: !isCaseSuccess || nowMode !== 'case' },
  );
  const [triggerGetTimes] = useLazyGetTimesQuery();

  const successCases = useMemo(
    () => (casesList ?? []).filter((item) => item.status === 'success'),
    [casesList],
  );

  const effectiveNowCases = useMemo(
    () => nowCases.filter((item) => item.times.length > 0),
    [nowCases],
  );

  const getTimesForCase = useCallback(
    (id: string): string[] => {
      if (id === caseId) return timeOptions ?? [];
      return caseTimesById[id] ?? [];
    },
    [caseId, caseTimesById, timeOptions],
  );

  const ensureCaseTimesLoaded = useCallback(
    async (id: string) => {
      if (id === caseId) return;
      if (caseTimesById[id] !== undefined) return;
      if (loadingCaseTimesRef.current.has(id)) return;
      const requestedType = nowType;
      loadingCaseTimesRef.current.add(id);
      setLoadingCaseTimesIds((prev) =>
        prev.includes(id) ? prev : [...prev, id],
      );
      try {
        const times = await triggerGetTimes({
          caseId: id,
          type: requestedType,
        }).unwrap();
        if (nowTypeRef.current !== requestedType) return;
        setCaseTimesById((prev) => ({ ...prev, [id]: times ?? [] }));
      } catch (error) {
        if (nowTypeRef.current !== requestedType) return;
        console.error('Failed to load times for case', id, error);
        setCaseTimesById((prev) => ({ ...prev, [id]: [] }));
      } finally {
        loadingCaseTimesRef.current.delete(id);
        setLoadingCaseTimesIds((prev) => prev.filter((item) => item !== id));
      }
    },
    [caseId, caseTimesById, nowType, triggerGetTimes],
  );

  const toggleCaseSelection = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        setNowCases((prev) => {
          if (prev.some((item) => item.caseId === id)) return prev;
          const seedTimes =
            id === caseId && nowTime ? [nowTime] : ([] as string[]);
          return [...prev, { caseId: id, times: seedTimes }];
        });
        void ensureCaseTimesLoaded(id);
      } else {
        setNowCases((prev) => prev.filter((item) => item.caseId !== id));
      }
    },
    [caseId, ensureCaseTimesLoaded, nowTime],
  );

  const updateCaseTimes = useCallback((id: string, times: string[]) => {
    setNowCases((prev) =>
      prev.map((item) =>
        item.caseId === id ? { ...item, times } : item,
      ),
    );
  }, []);

  const toggleCaseTime = useCallback(
    (id: string, time: string, checked: boolean) => {
      setNowCases((prev) =>
        prev.map((item) => {
          if (item.caseId !== id) return item;
          if (checked) {
            if (item.times.includes(time)) return item;
            return { ...item, times: [...item.times, time] };
          }
          return { ...item, times: item.times.filter((t) => t !== time) };
        }),
      );
    },
    [],
  );

  const { data: headerOptions, isLoading: isHeadersLoading } =
    useGetHeadersQuery(
      { caseId, type: nowType },
      { skip: !caseId || !isCaseSuccess },
    );

  const isEq2D = nowType === 'eq2D';
  /** YF has a single synthetic time slice; hide animation UI and force it off. */
  const animationSupported = nowType !== 'YF';
  /** Effective flag: treat as off immediately when unsupported (don't wait for useEffect). */
  const animationActive = animationEnabled && animationSupported;
  const skipNormalPlot = animationActive || nowMode !== 'single';
  const displayYLabel = appliedExpression || nowY;

  const expressionVariables = useMemo(
    () => buildExpressionVariables(headerOptions, nowX, nowY),
    [headerOptions, nowX, nowY],
  );
  const expressionMappingHint = useMemo(() => {
    const parts: string[] = [];
    if (nowX) parts.push(`x=${nowX}`);
    if (nowY) parts.push(`y=${nowY}`);
    const extras = expressionVariables.slice(0, 4);
    for (const variable of extras) {
      parts.push(`${variable.alias}=${variable.header}`);
    }
    if (expressionVariables.length > 4) parts.push('…');
    return parts.join(', ');
  }, [expressionVariables, nowX, nowY]);
  const parsedAppliedExpression = useMemo<ParsedExpression | undefined>(() => {
    if (!appliedExpression) return undefined;
    try {
      return parseExpression(appliedExpression, expressionVariables);
    } catch {
      return undefined;
    }
  }, [appliedExpression, expressionVariables]);
  const activeExpressionVariables = useMemo<ExpressionVariable[]>(() => {
    if (!parsedAppliedExpression) return [];
    return expressionVariables.filter((variable) =>
      parsedAppliedExpression.variableNames.includes(variable.alias),
    );
  }, [expressionVariables, parsedAppliedExpression]);
  const formulaVariables = useMemo<ExpressionVariable[]>(() => {
    const axes: ExpressionVariable[] = [];
    if (nowX) axes.push({ alias: 'x', header: nowX });
    if (nowY && nowY !== nowX) axes.push({ alias: 'y', header: nowY });
    return [...axes, ...expressionVariables];
  }, [expressionVariables, nowX, nowY]);
  const insertExpressionVariable = useCallback(
    (alias: string) => {
      const input = expressionInputRef.current;
      const start = input?.selectionStart ?? yExpression.length;
      const end = input?.selectionEnd ?? start;
      const nextExpression = `${yExpression.slice(0, start)}${alias}${yExpression.slice(end)}`;
      setYExpression(nextExpression);
      setExpressionError('');
      setVariableToInsert('');
      requestAnimationFrame(() => {
        input?.focus();
        const nextCursor = start + alias.length;
        input?.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [yExpression],
  );

  useEffect(() => {
    if (!appliedExpression || parsedAppliedExpression) return;
    setAppliedExpression('');
    setExpressionError(
      intl.formatMessage({ id: 'case.expression.unsupportedVariables' }),
    );
  }, [appliedExpression, intl, parsedAppliedExpression]);

  const { data: singlePlotData, isFetching: isSinglePlotFetching } =
    useGetPlotQuery(
      { caseId, type: nowType, time: nowTime!, x: nowX!, y: nowY! },
      {
        skip:
          !caseId ||
          !nowTime ||
          !nowX ||
          !nowY ||
          skipNormalPlot ||
          activeExpressionVariables.length > 0,
      },
    );

  const { data: eq2DPsiPlotData, isFetching: isEq2DPsiFetching } =
    useGetPlotQuery(
      { caseId, type: nowType, time: nowTime!, x: 'R', y: 'psi' },
      { skip: !caseId || !nowTime || !isEq2D || skipNormalPlot },
    );

  const [getPlotAcrossTimes] = useGetPlotAcrossTimesMutation();
  const [getPlotAcrossCases] = useGetPlotAcrossCasesMutation();
  const [getPlotWithVariables, { isLoading: isVariablePlotLoading }] =
    useGetPlotWithVariablesMutation();
  const [triggerGetPlot] = useLazyGetPlotQuery();
  const [downloadPlotCsv] = useDownloadPlotCsvMutation();
  const [downloadPlotCsvAcrossTimes] = useDownloadPlotCsvAcrossTimesMutation();
  const [downloadPlotCsvAcrossCases] = useDownloadPlotCsvAcrossCasesMutation();

  const getPlotForAnimation = useCallback(
    async (params: {
      caseId: string;
      type: string;
      time: string;
      x: string;
      y: string;
    }) => {
      const result = await triggerGetPlot(params, true).unwrap();
      return result ?? [];
    },
    [triggerGetPlot],
  );

  const [gfileDownloadProgress, setGfileDownloadProgress] = useState(0);
  const [isGfileDownloading, setIsGfileDownloading] = useState(false);
  const [imageFormatDialogOpen, setImageFormatDialogOpen] = useState(false);
  const [selectedImageFormat, setSelectedImageFormat] = useState<
    'png' | 'svg' | 'jpeg'
  >('png');
  const [chartRenderer, setChartRenderer] = useState<'canvas' | 'svg'>(
    'canvas',
  );
  const echartsRef = useRef<EChartsInstance | null>(null);

  const renameKeys = (
    points: { x: number; y: number; [key: string]: any }[],
    xKey: string,
    yKey: string,
  ): { [key: string]: any }[] => {
    if (!points) return [];
    return points.map((point) => {
      const { x, y, ...newPoint } = point;
      newPoint[xKey] = x;
      newPoint[yKey] = y;
      return newPoint;
    });
  };

  const applyExpression = useCallback(
    (data: any[], expression: ParsedExpression, xKey: string, yKey: string) => {
      if (!data || data.length === 0) return data;
      try {
        const result = evaluateExpression(data, expression, xKey, yKey);
        if (result.error === 'missing-value') {
          setExpressionError(
            intl.formatMessage({ id: 'case.expression.missingValue' }),
          );
        } else if (result.error === 'non-finite-result') {
          setExpressionError(
            intl.formatMessage({ id: 'case.expression.invalidResult' }),
          );
        }
        return result.data;
      } catch {
        setExpressionError(
          intl.formatMessage({ id: 'case.expression.invalidResult' }),
        );
        return data;
      }
    },
    [intl],
  );

  const handleAnimationError = useCallback(
    (code: string) => {
      if (code === 'preload-failed') {
        toast.error(intl.formatMessage({ id: 'case.animation.preloadFailed' }));
        return;
      }
      if (code.startsWith('eq2d-partial:')) {
        const count = code.split(':')[1] ?? '0';
        toast.error(
          intl.formatMessage({ id: 'case.animation.partialFailed' }, { count }),
        );
      }
    },
    [intl],
  );

  const animation = usePlotTimeAnimation({
    enabled: animationActive,
    isEq2D,
    caseId,
    nowType,
    nowX,
    nowY,
    timeOptions,
    expression: parsedAppliedExpression,
    expressionVariables: activeExpressionVariables,
    applyExpression,
    getPlotAcrossTimes,
    getPlot: getPlotForAnimation,
    onError: handleAnimationError,
  });

  const handleDownloadGfile = async () => {
    try {
      setIsGfileDownloading(true);
      setGfileDownloadProgress(0);
      const response = await fetch(
        `/api/Case/DownloadGfileTar?userId=${userId}&caseId=${caseId}`,
        { credentials: 'include' },
      );
      if (!response.ok) throw new Error('Download failed');
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      if (reader) {
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          chunks.push(result.value);
          receivedLength += result.value.byteLength;
          if (total > 0)
            setGfileDownloadProgress((receivedLength / total) * 100);
        }
      }
      const blob = new Blob(chunks.map((c) => new Uint8Array(c).buffer));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case-${caseId}-gfile.tar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(
        intl.formatMessage({ id: 'case.toast.gfileDownloadSuccess' }),
      );
    } catch {
      toast.error(intl.formatMessage({ id: 'case.toast.gfileDownloadError' }));
    } finally {
      setIsGfileDownloading(false);
      setGfileDownloadProgress(0);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      if (isEq2D) {
        if (animationActive) {
          const time = animation.currentTime;
          if (!time) {
            toast.error(intl.formatMessage({ id: 'case.toast.selectTime' }));
            return;
          }
          if (!animation.framesReady) {
            toast.error(
              intl.formatMessage({ id: 'case.toast.generateChartFirst' }),
            );
            return;
          }
          const contours = animation.currentEq2DContours;
          if (contours.length === 0) {
            toast.error(intl.formatMessage({ id: 'case.toast.noData' }));
            return;
          }
          let csv = 'R,Z,psi\n';
          for (const contour of contours) {
            for (const [r, z] of contour.points) {
              csv += `${r},${z},${contour.psi}\n`;
            }
          }
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `case-${caseId}-eq2D-${time}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success(
            intl.formatMessage({ id: 'case.toast.csvDownloadSuccess' }),
          );
          return;
        }
        if (!nowTime) {
          toast.error(intl.formatMessage({ id: 'case.toast.selectTime' }));
          return;
        }
        if (!singlePlotData || !eq2DPsiPlotData) {
          toast.error(
            intl.formatMessage({ id: 'case.toast.generateChartFirst' }),
          );
          return;
        }
        const len = Math.min(singlePlotData.length, eq2DPsiPlotData.length);
        if (len === 0) {
          toast.error(intl.formatMessage({ id: 'case.toast.noData' }));
          return;
        }
        let csv = 'R,Z,psi\n';
        for (let i = 0; i < len; i += 1) {
          csv += `${singlePlotData[i]?.x},${singlePlotData[i]?.y},${eq2DPsiPlotData[i]?.y}\n`;
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `case-${caseId}-eq2D-${nowTime}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(
          intl.formatMessage({ id: 'case.toast.csvDownloadSuccess' }),
        );
        return;
      }
      if (!nowX || !nowY) {
        toast.error(
          intl.formatMessage({ id: 'case.toast.generateChartFirst' }),
        );
        return;
      }
      let blob: Blob;
      if (animationActive) {
        // Export the current local frame so applied expressions match the chart.
        const time = animation.currentTime;
        if (!time) {
          toast.error(intl.formatMessage({ id: 'case.toast.selectTime' }));
          return;
        }
        if (!animation.framesReady) {
          toast.error(
            intl.formatMessage({ id: 'case.toast.generateChartFirst' }),
          );
          return;
        }
        const rows = animation.current1DData;
        if (!rows || rows.length === 0) {
          toast.error(intl.formatMessage({ id: 'case.toast.noData' }));
          return;
        }
        let csv = `${nowX},${nowY}\n`;
        for (const row of rows) {
          csv += `${row[nowX] ?? ''},${row[nowY] ?? ''}\n`;
        }
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      } else if (nowMode === 'single' && nowTime) {
        blob = await downloadPlotCsv({
          caseId,
          type: nowType,
          time: nowTime,
          x: nowX,
          y: nowY,
        }).unwrap();
      } else if (nowMode === 'time' && nowTimes.length > 0) {
        blob = await downloadPlotCsvAcrossTimes({
          caseId,
          type: nowType,
          times: nowTimes,
          x: nowX,
          y: nowY,
        }).unwrap();
      } else if (nowMode === 'case' && effectiveNowCases.length > 0) {
        blob = await downloadPlotCsvAcrossCases({
          cases: effectiveNowCases.map((c) => ({
            caseId: c.caseId,
            times: c.times,
          })),
          type: nowType,
          x: nowX,
          y: nowY,
        }).unwrap();
      } else {
        toast.error(
          intl.formatMessage({ id: 'case.toast.generateChartFirst' }),
        );
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case-${caseId}-${nowType}-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(
        intl.formatMessage({ id: 'case.toast.csvDownloadSuccess' }),
      );
    } catch (error) {
      console.error('CSV download failed:', error);
      toast.error(intl.formatMessage({ id: 'case.toast.csvDownloadError' }));
    }
  };

  const handleDownloadImage = () => {
    if (!echartsRef.current) {
      toast.error(intl.formatMessage({ id: 'case.toast.generateChartFirst' }));
      return;
    }
    setImageFormatDialogOpen(true);
  };

  const handleImageFormatConfirm = () => {
    if (selectedImageFormat === 'svg') {
      setChartRenderer('svg');
      setImageFormatDialogOpen(false);
      return;
    }
    try {
      const chart = echartsRef.current;
      if (!chart) {
        toast.error(intl.formatMessage({ id: 'case.toast.chartUnavailable' }));
        return;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `case-${caseId}-${nowType}-${timestamp}`;
      const extension = selectedImageFormat === 'jpeg' ? 'jpg' : 'png';
      const dataUrl = chart.getDataURL({
        type: selectedImageFormat === 'jpeg' ? 'jpeg' : 'png',
        pixelRatio: 2,
        backgroundColor: selectedImageFormat === 'jpeg' ? '#ffffff' : undefined,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(
        intl.formatMessage({ id: 'case.toast.imageDownloadSuccess' }),
      );
      setImageFormatDialogOpen(false);
    } catch (error) {
      console.error('Image download error:', error);
      toast.error(intl.formatMessage({ id: 'case.toast.imageDownloadError' }));
    }
  };

  const handleSvgChartReady = useCallback(
    (chart: EChartsInstance) => {
      echartsRef.current = chart;
      if (chartRenderer === 'svg') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `case-${caseId}-${nowType}-${timestamp}`;
        const svgData = chart.getDataURL({ type: 'svg' });
        const a = document.createElement('a');
        a.href = svgData;
        a.download = `${filename}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(
          intl.formatMessage({ id: 'case.toast.svgDownloadSuccess' }),
        );
        setChartRenderer('canvas');
      }
    },
    [chartRenderer, caseId, nowType, intl],
  );

  const fetchData = useCallback(async () => {
    if (isEq2D || animationActive) return;
    const shouldFetch =
      nowX &&
      nowY &&
      headerOptions?.includes(nowX) &&
      headerOptions?.includes(nowY);
    if (!shouldFetch) return;
    setIsPlotLoading(true);
    try {
      let rawData;
      if (nowMode === 'single' && nowTime) {
        rawData =
          activeExpressionVariables.length > 0
            ? await getPlotWithVariables({
                caseId,
                type: nowType,
                time: nowTime,
                x: nowX!,
                y: nowY!,
                variables: parsedAppliedExpression?.variableHeaders,
              }).unwrap()
            : singlePlotData;
      } else if (nowMode === 'time' && nowTimes.length > 0) {
        rawData = await getPlotAcrossTimes({
          caseId,
          type: nowType,
          times: nowTimes,
          x: nowX!,
          y: nowY!,
          variables: parsedAppliedExpression?.variableHeaders,
        }).unwrap();
      } else if (nowMode === 'case' && effectiveNowCases.length > 0) {
        rawData = await getPlotAcrossCases({
          type: nowType,
          cases: effectiveNowCases,
          x: nowX!,
          y: nowY!,
          variables: parsedAppliedExpression?.variableHeaders,
        }).unwrap();
      } else {
        setPlotData([]);
        setIsPlotLoading(false);
        return;
      }
      if (rawData && nowX && nowY) {
        let processedData = rawData;
        processedData = renameKeys(processedData, nowX, nowY);
        if (parsedAppliedExpression) {
          processedData = hydrateExpressionVariables(
            processedData,
            activeExpressionVariables,
          );
          processedData = applyExpression(
            processedData,
            parsedAppliedExpression,
            nowX,
            nowY,
          );
        }
        const pivotBySeriesXOccurrence = (
          rows: any[],
          xKey: string,
          yKey: string,
          seriesOrder?: string[],
        ) => {
          const referenceSeries = seriesOrder?.[0];
          const occurrenceBySeries = new Map<string, Map<string, number>>();
          const pivoted = new Map<string, any>();
          rows.forEach((item) => {
            const series = String(item?.time ?? referenceSeries ?? '');
            const xValue = item?.[xKey];
            const xToken = String(xValue);
            const seriesMap =
              occurrenceBySeries.get(series) ?? new Map<string, number>();
            occurrenceBySeries.set(series, seriesMap);
            const occurrenceIndex = seriesMap.get(xToken) ?? 0;
            seriesMap.set(xToken, occurrenceIndex + 1);
            const compositeKey = `${xToken}__${occurrenceIndex}`;
            const pivotRow =
              pivoted.get(compositeKey) ??
              (() => {
                const created = { [xKey]: xValue };
                pivoted.set(compositeKey, created);
                return created;
              })();
            if (referenceSeries !== undefined && series === referenceSeries)
              pivotRow[xKey] = xValue;
            pivotRow[`${yKey}_${series}`] = item?.[yKey];
          });
          return Array.from(pivoted.values());
        };
        if (nowMode === 'time' && nowTimes.length > 0)
          processedData = pivotBySeriesXOccurrence(
            processedData,
            nowX,
            nowY,
            nowTimes,
          );
        if (nowMode === 'case' && processedData.length > 0)
          processedData = pivotBySeriesXOccurrence(processedData, nowX, nowY);
        if (processedData.length > 0) {
          const xValues = processedData
            .map((d) => d[nowX])
            .filter((v) => v != null && !isNaN(v));
          let yValues: number[] = [];
          if (nowMode === 'time' && nowTimes.length > 0) {
            nowTimes.forEach((time) => {
              yValues = yValues.concat(
                processedData
                  .map((d) => d[`${nowY}_${time}`])
                  .filter((v) => v != null && !isNaN(v)),
              );
            });
          } else if (nowMode === 'case') {
            const caseSeriesKeys = new Set<string>();
            processedData.forEach((item) => {
              Object.keys(item || {}).forEach((key) => {
                if (key !== nowX && key !== 'time' && key !== 'caseId')
                  caseSeriesKeys.add(key);
              });
            });
            yValues = Array.from(caseSeriesKeys).flatMap((key) =>
              processedData
                .map((d) => parseNumeric(d[key]))
                .filter((v): v is number => v !== null),
            );
          } else {
            yValues = processedData
              .map((d) => d[nowY])
              .filter((v) => v != null && !isNaN(v));
          }
          if (xValues.length > 0) {
            const xMin = Math.min(...xValues);
            const xMax = Math.max(...xValues);
            const xPadding = (xMax - xMin) * 0.05;
            setXAxisDomain([xMin - xPadding, xMax + xPadding]);
          }
          if (yValues.length > 0) {
            const yMin = Math.min(...yValues);
            const yMax = Math.max(...yValues);
            const yPadding = (yMax - yMin) * 0.05;
            setYAxisDomain([yMin - yPadding, yMax + yPadding]);
          }
        }
        setPlotData(processedData);
      } else {
        setPlotData([]);
      }
    } catch (error) {
      console.error('Error fetching plot data:', error);
      setPlotData([]);
    } finally {
      setIsPlotLoading(false);
    }
  }, [
    isEq2D,
    animationActive,
    nowMode,
    nowTimes,
    effectiveNowCases,
    nowX,
    nowY,
    nowTime,
    nowType,
    parsedAppliedExpression,
    activeExpressionVariables,
    applyExpression,
    singlePlotData,
    headerOptions,
    caseId,
    getPlotWithVariables,
    getPlotAcrossTimes,
    getPlotAcrossCases,
  ]);

  useEffect(() => {
    if (isEq2D || animationActive) return;
    const handler = setTimeout(() => {
      fetchData();
    }, 200);
    return () => {
      clearTimeout(handler);
    };
  }, [fetchData, isEq2D, animationActive]);
  useEffect(() => {
    if (!isEq2D) return;
    if (nowMode !== 'single') setNowMode('single');
  }, [isEq2D, nowMode]);
  const prevNowModeRef = useRef(nowMode);
  // Seed / sync case-comparison selection when entering case mode (R3 / AC2).
  useEffect(() => {
    const enteredCase =
      nowMode === 'case' && prevNowModeRef.current !== 'case';
    prevNowModeRef.current = nowMode;
    if (!enteredCase) return;

    setNowCases((prev) => {
      const seedTimes = nowTime ? [nowTime] : [];
      if (prev.length === 0) {
        return [{ caseId, times: seedTimes }];
      }
      const others = prev.filter((item) => item.caseId !== caseId);
      const existing = prev.find((item) => item.caseId === caseId);
      let times: string[];
      if (!existing || existing.times.length === 0) {
        times = seedTimes;
      } else if (
        existing.times.length === 1 &&
        nowTime &&
        existing.times[0] !== nowTime
      ) {
        // Replace stale single auto-seed from mount/type load with current slice.
        times = [nowTime];
      } else if (nowTime && !existing.times.includes(nowTime)) {
        times = [...existing.times, nowTime];
      } else {
        times = existing.times;
      }
      return [...others, { caseId, times }];
    });
  }, [nowMode, caseId, nowTime]);
  // Navigating to another case resets comparison selection to the new current case.
  useEffect(() => {
    setCaseTimesById({});
    setLoadingCaseTimesIds([]);
    loadingCaseTimesRef.current.clear();
    setNowCases([{ caseId, times: nowTime ? [nowTime] : [] }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on case identity change
  }, [caseId]);
  // Drop cached times when plot type changes; clear selected times on other cases.
  useEffect(() => {
    setCaseTimesById({});
    setLoadingCaseTimesIds([]);
    loadingCaseTimesRef.current.clear();
    setNowCases((prev) =>
      prev.map((item) =>
        item.caseId === caseId
          ? { ...item, times: nowTime ? [nowTime] : [] }
          : { ...item, times: [] },
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on type change
  }, [nowType]);
  // YF does not support multi-time animation; force it off when entering YF.
  useEffect(() => {
    if (nowType === 'YF' && animationEnabled) {
      setAnimationEnabled(false);
    }
  }, [nowType, animationEnabled]);
  // Prefetch times for selected non-current cases.
  useEffect(() => {
    if (nowMode !== 'case') return;
    nowCases.forEach((item) => {
      if (item.caseId === caseId) return;
      void ensureCaseTimesLoaded(item.caseId);
    });
  }, [nowMode, nowCases, caseId, ensureCaseTimesLoaded]);
  // Animation is orthogonal to nowMode: do not mutate mode on toggle (R9/AC5 restore path).
  useEffect(() => {
    if (!timeOptions || timeOptions.length === 0) {
      if (lastTypeWithTimesRef.current !== nowType) {
        setNowTime(undefined);
        setNowTimes([]);
        lastTypeWithTimesRef.current = nowType;
      }
      return;
    }
    const latestTime = getLatestTimeValue(timeOptions);
    if (lastTypeWithTimesRef.current !== nowType) {
      if (latestTime) {
        setNowTime(latestTime);
        setNowTimes([latestTime]);
        setNowCases((prev) =>
          prev.map((item) =>
            item.caseId === caseId
              ? { ...item, times: [latestTime] }
              : item,
          ),
        );
      } else {
        setNowTime(undefined);
        setNowTimes([]);
      }
      lastTypeWithTimesRef.current = nowType;
      return;
    }
    if (!nowTime || !timeOptions.includes(nowTime)) setNowTime(latestTime);
    if (
      nowTimes.length === 0 ||
      nowTimes.some((time) => !timeOptions.includes(time))
    )
      setNowTimes(latestTime ? [latestTime] : []);
    if (nowMode === 'case') {
      setNowCases((prev) =>
        prev.map((item) => {
          if (item.caseId !== caseId) return item;
          if (
            item.times.length === 0 ||
            item.times.some((time) => !timeOptions.includes(time))
          ) {
            return {
              ...item,
              times: latestTime ? [latestTime] : [],
            };
          }
          return item;
        }),
      );
    }
  }, [timeOptions, nowType, nowTime, nowTimes, nowMode, caseId]);
  useEffect(() => {
    if (!headerOptions || headerOptions.length === 0) {
      if (lastTypeWithHeadersRef.current !== nowType) {
        setNowX(undefined);
        setNowY(undefined);
        lastTypeWithHeadersRef.current = nowType;
      }
      return;
    }
    const firstHeader = headerOptions[0];
    const secondHeader = headerOptions[1] ?? headerOptions[0];
    if (lastTypeWithHeadersRef.current !== nowType) {
      setNowX(firstHeader);
      setNowY(secondHeader);
      lastTypeWithHeadersRef.current = nowType;
      return;
    }
    if (!nowX || !headerOptions.includes(nowX)) setNowX(firstHeader);
    if (!nowY || !headerOptions.includes(nowY)) setNowY(secondHeader);
  }, [headerOptions, nowType, nowX, nowY]);
  useEffect(() => {
    if (!isEq2D || !headerOptions || headerOptions.length === 0) return;
    if (headerOptions.includes('R') && nowX !== 'R') setNowX('R');
    if (headerOptions.includes('Z') && nowY !== 'Z') setNowY('Z');
  }, [headerOptions, isEq2D, nowX, nowY]);
  // 应用 AI 绘图请求：等切换类型后的默认时间点/坐标轴初始化完成（上面两个 effect），再覆盖为请求中的值
  useEffect(() => {
    if (!pendingPlot || pendingPlot.type !== nowType) return;
    if (
      lastTypeWithTimesRef.current !== nowType ||
      lastTypeWithHeadersRef.current !== nowType ||
      !timeOptions ||
      !headerOptions
    )
      return;
    const plot = pendingPlot;
    setPendingPlot(null);
    if (plot.mode === 'time' && plot.times?.length) {
      setNowMode('time');
      setNowTimes(plot.times);
      setNowTime(plot.times[plot.times.length - 1]);
    } else {
      setNowMode('single');
      if (plot.time) {
        setNowTime(plot.time);
        setNowTimes([plot.time]);
      }
    }
    if (nowType === 'eq2D') return;
    setNowX(plot.x);
    setNowY(plot.y);
    const expression = plot.expression?.trim() ?? '';
    setYExpression(expression);
    setExpressionError('');
    if (!expression) {
      setAppliedExpression('');
      return;
    }
    try {
      parseExpression(
        expression,
        buildExpressionVariables(headerOptions, plot.x, plot.y),
      );
      setAppliedExpression(expression);
    } catch (err) {
      setAppliedExpression('');
      setExpressionError(
        `Error: ${err instanceof Error ? err.message : 'Invalid'}`,
      );
    }
  }, [pendingPlot, nowType, timeOptions, headerOptions]);
  // AI 建议调参后“用新参数新建算例”：以本算例的表单数据为基础叠加修改，跳转到动态表单
  const dispatch = useAppDispatch();
  const canRerunWithChanges =
    caseData?.jsonOrNamelist !== true && !!caseData?.caseJsonPrototype;
  const handleRerunWithChanges = useCallback(
    (changes: ProposedFieldChange[]) => {
      let data: DynamicFormData[string];
      try {
        data = JSON.parse(caseData?.caseJsonPrototype ?? '');
      } catch {
        toast.error(intl.formatMessage({ id: 'ai.case.rerunUnavailable' }));
        return;
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        toast.error(intl.formatMessage({ id: 'ai.case.rerunUnavailable' }));
        return;
      }
      for (const change of changes) {
        data[change.panelId] = {
          ...(data[change.panelId] ?? {}),
          [change.fieldId]: change.suggestedValue,
        };
      }
      dispatch(resetConfig({ configName: 'baldur' }));
      dispatch(setConfigData({ configName: 'baldur', data }));
      dispatch(setCurrentConfig({ name: 'baldur', totalPanels: 0 }));
      toast.success(
        intl.formatMessage(
          { id: 'ai.case.rerunPrefilled' },
          { count: changes.length },
        ),
      );
      setLocation('/add-cases/dynamic/baldur/0');
    },
    [caseData?.caseJsonPrototype, dispatch, intl, setLocation],
  );

  const handleApplyPlot = useCallback((plot: PlotRequest) => {
    setAnimationEnabled(false);
    setPendingPlot(plot);
    if (plot.type !== nowTypeRef.current) setNowType(plot.type);
  }, []);

  const isLoading =
    isCaseLoading ||
    (!isRunning && !isFailed && (isTimesLoading || isHeadersLoading));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = chartContainerRef.current;
    if (!container) return;
    const resizeChart = () => {
      echartsRef.current?.resize();
    };
    resizeChart();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resizeChart();
      });
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resizeChart);
    }
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', resizeChart);
    };
  }, [isLoading]);

  const convertTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // gfile is download-only (EFIT .dat via GetGFile); it is not a CSV plot type.
  const typeOptions = [
    { label: intl.formatMessage({ id: 'case.type.eq1D' }), value: 'eq1D' },
    { label: intl.formatMessage({ id: 'case.type.eq2D' }), value: 'eq2D' },
    { label: intl.formatMessage({ id: 'case.type.profiles' }), value: 'prof' },
    { label: intl.formatMessage({ id: 'case.type.xf' }), value: 'XF' },
    { label: intl.formatMessage({ id: 'case.type.yf' }), value: 'YF' },
  ];

  const modeOptions = [
    {
      label: intl.formatMessage({ id: 'case.mode.singleSlice' }),
      value: 'single',
    },
    {
      label: intl.formatMessage({ id: 'case.mode.compareTime' }),
      value: 'time',
    },
    {
      label: intl.formatMessage({ id: 'case.mode.compareCases' }),
      value: 'case',
    },
  ];

  const formatAxisValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) return '';
    if (value === 0) return '0';
    const abs = Math.abs(value);
    if (abs >= 1e3 || abs <= 1e-2) return value.toExponential(2);
    return value;
  }, []);

  const parseNumeric = (value: unknown): number | null => {
    if (value === undefined || value === null) return null;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const eq2DContours = useMemo(() => {
    if (animationActive && isEq2D) return animation.currentEq2DContours;
    if (!isEq2D || !singlePlotData || !eq2DPsiPlotData)
      return [] as { psi: number; points: [number, number][] }[];
    const len = Math.min(singlePlotData.length, eq2DPsiPlotData.length);
    if (len === 0) return [] as { psi: number; points: [number, number][] }[];
    const byPsi = new Map<number, [number, number][]>();
    for (let i = 0; i < len; i += 1) {
      const r = parseNumeric(singlePlotData[i]?.x);
      const z = parseNumeric(singlePlotData[i]?.y);
      const psi = parseNumeric(eq2DPsiPlotData[i]?.y);
      if (r === null || z === null || psi === null) continue;
      const points = byPsi.get(psi) ?? [];
      points.push([r, z]);
      byPsi.set(psi, points);
    }
    const psiLevels = Array.from(byPsi.keys()).sort((a, b) => a - b);
    return psiLevels.flatMap((psi) => {
      const points = byPsi.get(psi) ?? [];
      const uniquePointCount = new Set(points.map(([r, z]) => `${r}|${z}`))
        .size;
      if (uniquePointCount < 3) return [];
      if (points.length > 1) {
        const [r0, z0] = points[0];
        const [r1, z1] = points[points.length - 1];
        if (r0 !== r1 || z0 !== z1) points.push([r0, z0]);
      }
      return [{ psi, points }];
    });
  }, [
    animation.currentEq2DContours,
    animationActive,
    eq2DPsiPlotData,
    isEq2D,
    singlePlotData,
  ]);

  const activePlotData = useMemo(() => {
    if (animationActive && !isEq2D) return animation.current1DData;
    return plotData;
  }, [animation.current1DData, animationActive, isEq2D, plotData]);

  const sanitizedPlotData = useMemo(() => {
    if (!nowX) return activePlotData;
    return activePlotData.filter((item) => parseNumeric(item[nowX]) !== null);
  }, [activePlotData, nowX]);

  const seriesKeys = useMemo(() => {
    if (!nowX || !nowY) return [] as string[];
    if (animationActive) return [nowY];
    if (nowMode === 'single') return [nowY];
    if (nowMode === 'time') return nowTimes.map((time) => `${nowY}_${time}`);
    if (nowMode === 'case') {
      const keys: string[] = [];
      plotData.forEach((item) => {
        Object.keys(item || {}).forEach((key) => {
          if (
            key !== nowX &&
            key !== 'time' &&
            key !== 'caseId' &&
            !keys.includes(key)
          )
            keys.push(key);
        });
      });
      return keys;
    }
    return [] as string[];
  }, [animationActive, plotData, nowMode, nowTimes, nowX, nowY]);

  const caseUuidToDisplayId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of successCases) {
      map.set(item.id, item.caseId);
    }
    if (caseData?.id != null && caseData?.caseId != null) {
      map.set(caseData.id, caseData.caseId);
    }
    return map;
  }, [successCases, caseData]);

  const seriesMeta = useMemo(() => {
    const total = seriesKeys.length || 1;
    return seriesKeys.map((key, index) => {
      let label = key;
      if (animationActive || nowMode === 'single')
        label = displayYLabel ?? key;
      else if (nowMode === 'time' && nowY)
        label = key.startsWith(`${nowY}_`) ? key.slice(`${nowY}_`.length) : key;
      else if (nowMode === 'case' && nowY) {
        // Pivot key is `${nowY}_${uuid}:${time}`; legend shows `#<caseId> @ <time>`.
        const raw = key.startsWith(`${nowY}_`)
          ? key.slice(`${nowY}_`.length)
          : key;
        const sep = raw.indexOf(':');
        if (sep > 0) {
          const uuid = raw.slice(0, sep);
          const time = raw.slice(sep + 1);
          const displayId = caseUuidToDisplayId.get(uuid);
          label =
            displayId != null ? `#${displayId} @ ${time}` : `#? @ ${time}`;
        } else {
          label = raw;
        }
      }
      let color = '#0078d4';
      if (!animationActive && nowMode === 'time')
        color = `hsl(${(index * 360) / (nowTimes.length || total)}, 70%, 50%)`;
      else if (!animationActive && nowMode === 'case')
        color = `hsl(${(index * 360) / 8}, 70%, 50%)`;
      return { key, label, color };
    });
  }, [
    seriesKeys,
    animationActive,
    nowMode,
    nowTimes,
    nowY,
    displayYLabel,
    caseUuidToDisplayId,
  ]);

  const effectiveXDomain =
    animationActive && !isEq2D ? animation.domain1D?.x : xAxisDomain;
  const effectiveYDomain =
    animationActive && !isEq2D ? animation.domain1D?.y : yAxisDomain;
  const displayTime = animationActive ? animation.currentTime : nowTime;

  const echartsOption = useMemo(() => {
    if (isEq2D) {
      if (eq2DContours.length === 0) return null;
      const allPoints = eq2DContours.flatMap((c) => c.points);
      const rValues = allPoints
        .map((p) => p[0])
        .filter((v) => Number.isFinite(v));
      const zValues = allPoints
        .map((p) => p[1])
        .filter((v) => Number.isFinite(v));
      const rMin = Math.min(...rValues);
      const rMax = Math.max(...rValues);
      const zMin = Math.min(...zValues);
      const zMax = Math.max(...zValues);
      const rPadding = (rMax - rMin) * 0.05;
      const zPadding = (zMax - zMin) * 0.05;
      const psiValues = eq2DContours
        .map((c) => c.psi)
        .filter((v) => Number.isFinite(v));
      const psiMin = Math.min(...psiValues);
      const psiMax = Math.max(...psiValues);
      const fixedR = animationActive ? animation.domainEq2D?.r : undefined;
      const fixedZ = animationActive ? animation.domainEq2D?.z : undefined;
      const fixedPsi = animationActive ? animation.domainEq2D?.psi : undefined;
      const axisRMin =
        fixedR?.[0] ?? (Number.isFinite(rMin) ? rMin - rPadding : undefined);
      const axisRMax =
        fixedR?.[1] ?? (Number.isFinite(rMax) ? rMax + rPadding : undefined);
      const axisZMin =
        fixedZ?.[0] ?? (Number.isFinite(zMin) ? zMin - zPadding : undefined);
      const axisZMax =
        fixedZ?.[1] ?? (Number.isFinite(zMax) ? zMax + zPadding : undefined);
      const mapPsiMin = fixedPsi?.[0] ?? psiMin;
      const mapPsiMax = fixedPsi?.[1] ?? psiMax;
      const startColor = '#0078d4';
      const endColor = '#ee6666';
      const parseHex = (hex: string) => {
        const n = hex.trim().replace('#', '');
        if (n.length !== 6) return null;
        const r = parseInt(n.slice(0, 2), 16);
        const g = parseInt(n.slice(2, 4), 16);
        const b = parseInt(n.slice(4, 6), 16);
        if ([r, g, b].some((v) => Number.isNaN(v))) return null;
        return { r, g, b };
      };
      const interpolateColor = (tRaw: number) => {
        const t = Math.min(1, Math.max(0, tRaw));
        const start = parseHex(startColor);
        const end = parseHex(endColor);
        if (!start || !end) return startColor;
        return `rgb(${Math.round(start.r + (end.r - start.r) * t)}, ${Math.round(start.g + (end.g - start.g) * t)}, ${Math.round(start.b + (end.b - start.b) * t)})`;
      };
      const series = eq2DContours.map((contour) => {
        const t =
          mapPsiMax === mapPsiMin
            ? 0
            : (contour.psi - mapPsiMin) / (mapPsiMax - mapPsiMin);
        const color = interpolateColor(t);
        return {
          name: `psi=${String(formatAxisValue(contour.psi))}`,
          type: 'line' as const,
          data: contour.points.map(([r, z]) => [r, z, contour.psi]),
          encode: { x: 0, y: 1, tooltip: 2 },
          showSymbol: false,
          lineStyle: { color, width: 1, opacity: 0.85 },
          itemStyle: { color },
          emphasis: { focus: 'series' as const, lineStyle: { width: 2 } },
          animationDuration: 0,
          animation: false,
        };
      });
      return {
        animation: false,
        animationDuration: 0,
        tooltip: {
          trigger: 'item' as const,
          formatter: (params: any) => {
            const rVal = params?.data?.[0];
            const zVal = params?.data?.[1];
            const psiVal = params?.data?.[2];
            const psiText =
              psiVal != null && Number.isFinite(psiVal)
                ? String(formatAxisValue(psiVal))
                : String(params?.seriesName ?? '');
            return `psi: ${psiText}<br/>R: ${String(formatAxisValue(rVal))}<br/>Z: ${String(formatAxisValue(zVal))}`;
          },
        },
        legend: { show: false },
        grid: { left: 60, right: 80, top: 30, bottom: 60 },
        visualMap: {
          type: 'continuous',
          min: mapPsiMin,
          max: mapPsiMax,
          right: 10,
          top: 30,
          bottom: 30,
          orient: 'vertical',
          calculable: true,
          inRange: { color: [startColor, endColor] },
          formatter: (value: number) => String(formatAxisValue(value)),
          text: ['psi', ''],
        },
        xAxis: {
          type: 'value' as const,
          name: 'R',
          nameLocation: 'middle' as const,
          nameGap: 30,
          min: axisRMin,
          max: axisRMax,
          axisLabel: { formatter: (v: number) => String(formatAxisValue(v)) },
          splitLine: { show: true },
        },
        yAxis: {
          type: 'value' as const,
          name: 'Z',
          nameLocation: 'middle' as const,
          nameGap: 40,
          min: axisZMin,
          max: axisZMax,
          axisLabel: { formatter: (v: number) => String(formatAxisValue(v)) },
          splitLine: { show: true },
        },
        dataZoom: [
          { type: 'inside' as const, xAxisIndex: 0 },
          { type: 'inside' as const, yAxisIndex: 0 },
        ],
        series,
      };
    }
    if (!nowX || sanitizedPlotData.length === 0 || seriesKeys.length === 0)
      return null;
    const xData = sanitizedPlotData.map(
      (item) => parseNumeric(item[nowX]) as number,
    );
    const series = seriesMeta.map((meta) => ({
      name: meta.label,
      type: 'line' as const,
      data: sanitizedPlotData.map((item, idx) => [
        xData[idx],
        parseNumeric(item[meta.key]),
      ]),
      lineStyle: { color: meta.color, width: 2 },
      itemStyle: { color: meta.color },
      showSymbol: false,
      animationDuration: 0,
      animation: false,
    }));
    return {
      animation: false,
      animationDuration: 0,
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'cross' as const },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const xVal = params[0]?.data?.[0];
          const lines = params.map((p: any) => {
            const yVal = p.data?.[1];
            const formatted =
              yVal != null && Number.isFinite(yVal)
                ? formatAxisValue(yVal)
                : '-';
            return `<span style="color:${p.color}">●</span> ${p.seriesName}: ${formatted}`;
          });
          return `${nowX}: ${formatAxisValue(xVal)}<br/>${lines.join('<br/>')}`;
        },
      },
      legend: {
        show: !animationActive,
        data: seriesMeta.map((m) => m.label),
        top: 10,
      },
      grid: {
        left: 60,
        right: 40,
        top: animationActive ? 30 : 60,
        bottom: 60,
      },
      xAxis: {
        type: 'value' as const,
        name: nowX ?? 'X',
        nameLocation: 'middle' as const,
        nameGap: 30,
        min: effectiveXDomain?.[0],
        max: effectiveXDomain?.[1],
        axisLabel: { formatter: (v: number) => String(formatAxisValue(v)) },
        splitLine: { show: true },
      },
      yAxis: {
        type: 'value' as const,
        name: displayYLabel ?? 'Y',
        nameLocation: 'middle' as const,
        nameGap: 50,
        min: effectiveYDomain?.[0],
        max: effectiveYDomain?.[1],
        axisLabel: { formatter: (v: number) => String(formatAxisValue(v)) },
        splitLine: { show: true },
      },
      dataZoom: [
        { type: 'inside' as const, xAxisIndex: 0 },
        { type: 'inside' as const, yAxisIndex: 0 },
      ],
      series,
    };
  }, [
    animation.domainEq2D,
    animationActive,
    displayYLabel,
    eq2DContours,
    effectiveXDomain,
    effectiveYDomain,
    formatAxisValue,
    isEq2D,
    nowX,
    sanitizedPlotData,
    seriesKeys,
    seriesMeta,
  ]);

  const effectiveIsPlotLoading = animationActive
    ? animation.isLoading
    : isPlotLoading ||
      isVariablePlotLoading ||
      (isEq2D && (isSinglePlotFetching || isEq2DPsiFetching));
  const showNoData =
    !effectiveIsPlotLoading &&
    (!echartsOption ||
      (isEq2D ? eq2DContours.length === 0 : sanitizedPlotData.length === 0));
  const hasTimeOptions = (timeOptions?.length ?? 0) > 0;
  const animationToggleDisabled = !animationSupported || !hasTimeOptions;

  if (isLoading) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="text-sm text-gray-500 animate-pulse">
          <FormattedMessage id="case.loading" />
        </div>
      </div>
    );
  }

  if (isRunning || isFailed || isTerminated) {
    return (
      <div className="-m-4 flex flex-col h-[calc(100vh-120px)] bg-muted/10">
        {/* Execution Monitor Ribbon Bar */}
        {!ribbonCollapsed && (
          <div className="bg-[var(--ribbon-content-bg)] border-b border-[var(--ribbon-separator)] flex items-stretch px-1 min-h-[60px] shrink-0">
            <RibbonGroup title="导航与视图">
              <RibbonButton
                icon={ArrowLeft}
                label="返回列表"
                onClick={() => setLocation('/cases')}
              />
              <RibbonButton
                icon={RotateCcw}
                label="刷新状态"
                onClick={() => refetchCase()}
              />
            </RibbonGroup>
            {aiEnabled && (
              <RibbonGroup title={intl.formatMessage({ id: 'ai.toggle' })}>
                <RibbonButton
                  icon={Bot}
                  label={intl.formatMessage({ id: 'ai.case.title' })}
                  active={aiOpen}
                  onClick={() => setAiOpen((open) => !open)}
                />
              </RibbonGroup>
            )}

            {isRunning && (
              <RibbonGroup title="任务控制">
                <RibbonButton
                  icon={OctagonX}
                  label="终止计算"
                  disabled={isTerminating}
                  className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
                  onClick={() => setShowTerminateConfirm(true)}
                />
              </RibbonGroup>
            )}

            <RibbonGroup title="快速新建">
              <RibbonButton
                icon={FileJson}
                label="新建算例"
                onClick={() => setLocation('/add-cases')}
              />
            </RibbonGroup>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col space-y-3 max-w-7xl w-full mx-auto">
          {/* Summary Metric Card */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg font-bold text-foreground tracking-tight">
                    算例 #{caseData?.caseId || caseId}
                  </h2>
                  {isRunning && (
                    <Badge
                      variant="secondary"
                      className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1.5 py-0.5 px-2.5"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                      </span>
                      <span>运行中</span>
                    </Badge>
                  )}
                  {isTerminated && (
                    <Badge
                      variant="outline"
                      className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 flex items-center gap-1.5 py-0.5 px-2.5 font-medium"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>已终止</span>
                    </Badge>
                  )}
                  {isFailed && !isTerminated && (
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1.5 py-0.5 px-2.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>计算失败</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-2xl">
                  {caseData?.comment || '无备注信息'}
                </p>
              </div>

              {/* Quick Info Badges & Actions */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/50">
                  <Server className="h-3.5 w-3.5 text-sky-500" />
                  <span>{getSupercomputerName(caseData?.superComputer)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/50 font-mono">
                  <Timer className="h-3.5 w-3.5 text-amber-500" />
                  <span>耗时: {formatElapsed(elapsedSeconds)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/50">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{formatDate(caseData?.createdAt)}</span>
                </div>

                {isRunning && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    onClick={() => setShowTerminateConfirm(true)}
                    disabled={isTerminating}
                  >
                    {isTerminating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <OctagonX className="h-3.5 w-3.5" />
                    )}
                    终止计算
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Pipeline Stepper */}
          <PipelineStepStepper
            logs={displayLogs}
            status={
              isRunning
                ? logStreamStatus
                : isTerminated
                ? 'terminated'
                : 'failed'
            }
            isSuccess={!isFailed && !isTerminated && isLogSuccess}
            isTerminated={isTerminated}
            className="shrink-0"
          />

          {/* Realtime Terminal Container */}
          <div className="flex-1 min-h-[420px] flex flex-col">
            <CaseLogTerminal
              logs={displayLogs}
              logsByFile={displayLogsByFile}
              availableFiles={displayAvailableFiles}
              status={
                isRunning
                  ? logStreamStatus
                  : isHistoricalLogsLoading && displayLogs.length === 0
                  ? 'connecting'
                  : isTerminated
                  ? 'terminated'
                  : 'failed'
              }
              isCompleted={isFailed || isTerminated || isLogCompleted}
              isSuccess={!isFailed && !isTerminated && isLogSuccess}
              isTerminated={isTerminated}
              errorMessage={
                logErrorMessage ||
                (isTerminated
                  ? '算例计算已由用户主动切断终止'
                  : isFailed
                  ? '算例计算失败，请检查参数与日志'
                  : null)
              }
              caseId={caseId}
              onClear={clearLiveLogs}
              onReconnect={reconnectLogStream}
              maxHeight="h-full"
              className="flex-1 min-h-[380px]"
            />
          </div>
        </div>

        {/* AI Case Assistant */}
        {aiEnabled && aiOpen && (
          <aside className="w-[380px] shrink-0 border-l border-gray-200 bg-white p-2">
            <CaseAssistant
              caseId={caseId}
              userId={userId}
              onRerunWithChanges={
                canRerunWithChanges ? handleRerunWithChanges : undefined
              }
              onClose={() => setAiOpen(false)}
            />
          </aside>
        )}
        </div>

        {/* Terminate Confirmation Modal */}
        <Dialog open={showTerminateConfirm} onOpenChange={setShowTerminateConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-foreground">
                    确认切断程序运行？
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    此操作将立即终止远程超算任务与后台数据流
                  </p>
                </div>
              </div>
            </DialogHeader>
            <div className="py-2 text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border border-border/60 space-y-1">
              <p>• 正在执行的计算进程或 Slurm 排队作业将被立即取消；</p>
              <p>• 未完成的计算输出与分析图表将无法生成；</p>
              <p>• 算例状态将更新为已终止，您之后可随时回溯已输出的阶段日志。</p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTerminateConfirm(false)}
                disabled={isTerminating}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleTerminateCase}
                disabled={isTerminating}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isTerminating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    正在切断运行...
                  </>
                ) : (
                  <>
                    <OctagonX className="h-3.5 w-3.5 mr-1.5" />
                    确认切断运行
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="-m-4 flex flex-col h-[calc(100vh-120px)]">
      {/* Analyze Ribbon Bar */}
      {!ribbonCollapsed && (
        <div className="bg-[var(--ribbon-content-bg)] border-b border-[var(--ribbon-separator)] flex items-stretch px-1 min-h-[60px] shrink-0">
          <RibbonGroup
            title={intl.formatMessage({ id: 'case.ribbon.topology' })}
          >
            {typeOptions.map((opt) => (
              <RibbonButton
                key={opt.value}
                icon={opt.value === 'eq2D' ? Grid3x3 : Database}
                label={opt.label}
                active={nowType === opt.value}
                onClick={() => {
                  if (opt.value === 'YF') setAnimationEnabled(false);
                  setNowType(opt.value);
                }}
              />
            ))}
          </RibbonGroup>
          <RibbonGroup
            title={intl.formatMessage({ id: 'case.ribbon.comparison' })}
          >
            {modeOptions.map((opt) => (
              <RibbonButton
                key={opt.value}
                icon={
                  opt.value === 'single'
                    ? Play
                    : opt.value === 'time'
                      ? Clock
                      : Database
                }
                label={opt.label}
                active={!animationActive && nowMode === opt.value}
                disabled={
                  (isEq2D && opt.value !== 'single') ||
                  (animationActive && opt.value !== 'single')
                }
                onClick={() => {
                  if (animationActive && opt.value !== 'single') {
                    toast.message(
                      intl.formatMessage({
                        id: 'case.animation.compareDisabled',
                      }),
                    );
                    return;
                  }
                  setNowMode(opt.value);
                }}
              />
            ))}
          </RibbonGroup>
          <RibbonGroup title={intl.formatMessage({ id: 'case.ribbon.export' })}>
            <RibbonButton
              icon={Download}
              label={intl.formatMessage({ id: 'case.button.gfile' })}
              onClick={handleDownloadGfile}
              disabled={isGfileDownloading}
            />
            <RibbonButton
              icon={FileSpreadsheet}
              label={intl.formatMessage({ id: 'case.button.csv' })}
              onClick={handleDownloadCsv}
              disabled={!nowX || !nowY}
            />
            <RibbonButton
              icon={Image}
              label={intl.formatMessage({ id: 'case.button.image' })}
              onClick={handleDownloadImage}
              disabled={!nowX || !nowY}
            />
          </RibbonGroup>
          <RibbonGroup title={intl.formatMessage({ id: 'case.ribbon.tools' })}>
            <RibbonButton
              icon={Terminal}
              label="运行日志"
              onClick={() => setShowLogModal(true)}
            />
          </RibbonGroup>
          {aiEnabled && (
            <RibbonGroup title={intl.formatMessage({ id: 'ai.toggle' })}>
              <RibbonButton
                icon={Bot}
                label={intl.formatMessage({ id: 'ai.case.title' })}
                active={aiOpen}
                onClick={() => setAiOpen((open) => !open)}
              />
            </RibbonGroup>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Case Summary & Plot Config */}
        <div className="w-72 border-r border-gray-200 bg-white shrink-0 overflow-y-auto">
          {/* Case Summary */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setShowCaseSummary(!showCaseSummary)}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              {showCaseSummary ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <FormattedMessage id="case.summary.title" />
            </button>
            {showCaseSummary && (
              <div className="px-3 pb-3 space-y-2">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 tracking-wider">
                    <FormattedMessage id="case.summary.caseId" />
                  </div>
                  <div className="text-xs font-medium text-gray-800">
                    #{caseData?.caseId}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 tracking-wider">
                    <FormattedMessage id="case.summary.created" />
                  </div>
                  <div className="text-xs text-gray-600">
                    {convertTime(caseData?.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 tracking-wider">
                    <FormattedMessage id="case.summary.completed" />
                  </div>
                  <div className="text-xs text-gray-600">
                    {convertTime(caseData?.updatedAt)}
                  </div>
                </div>
                {caseData?.comment && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 tracking-wider">
                      <FormattedMessage id="case.summary.notes" />
                    </div>
                    <div className="text-xs text-gray-600">
                      {caseData.comment}
                    </div>
                  </div>
                )}
                {isGfileDownloading && (
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">
                      {intl.formatMessage(
                        { id: 'case.summary.downloading' },
                        { progress: Math.round(gfileDownloadProgress) },
                      )}
                    </div>
                    <Progress value={gfileDownloadProgress} className="h-1.5" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plot Configuration - Time Slices */}
          <div className="border-b border-gray-100">
            <div className="px-3 py-2 text-xs font-semibold text-gray-700">
              <FormattedMessage id="case.config.timeSlices" />
            </div>
            {animationSupported && (
              <div className="px-3 pb-2 flex items-center justify-between gap-2">
                <Label
                  htmlFor="plot-animation-toggle"
                  className="text-[11px] text-gray-600 cursor-pointer"
                >
                  <FormattedMessage id="case.animation.toggle" />
                </Label>
                <Switch
                  id="plot-animation-toggle"
                  size="sm"
                  checked={animationEnabled}
                  disabled={animationToggleDisabled}
                  onCheckedChange={(checked) =>
                    setAnimationEnabled(Boolean(checked))
                  }
                />
              </div>
            )}
            {animationSupported && animationEnabled ? (
              <div className="px-3 pb-3 space-y-2">
                {animation.isLoading ? (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-gray-500">
                      {intl.formatMessage(
                        { id: 'case.animation.loading' },
                        { progress: Math.round(animation.loadProgress) },
                      )}
                    </div>
                    <Progress
                      value={animation.loadProgress}
                      className="h-1.5"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        disabled={!animation.canPlay}
                        onClick={animation.togglePlay}
                        title={
                          animation.isPlaying
                            ? intl.formatMessage({ id: 'case.animation.pause' })
                            : intl.formatMessage({ id: 'case.animation.play' })
                        }
                      >
                        {animation.isPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-400 mb-0.5">
                          <FormattedMessage id="case.animation.currentTime" />
                        </div>
                        <div
                          className="text-[11px] text-gray-700 truncate"
                          title={displayTime ?? ''}
                        >
                          {displayTime ?? '—'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, (timeOptions?.length ?? 1) - 1)}
                      step={1}
                      value={Math.min(
                        animation.frameIndex,
                        Math.max(0, (timeOptions?.length ?? 1) - 1),
                      )}
                      disabled={
                        !animation.framesReady ||
                        (timeOptions?.length ?? 0) === 0
                      }
                      onChange={(e) => animation.seekTo(Number(e.target.value))}
                      className="w-full h-1.5 accent-[var(--office-blue)] cursor-pointer disabled:opacity-50"
                    />
                    {!hasTimeOptions && (
                      <div className="text-[10px] text-gray-400">
                        <FormattedMessage id="case.animation.noTimes" />
                      </div>
                    )}
                    {hasTimeOptions && (timeOptions?.length ?? 0) <= 1 && (
                      <div className="text-[10px] text-gray-400">
                        <FormattedMessage id="case.animation.needMoreTimes" />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {nowMode === 'single' && (
                  <div className="px-3 pb-3">
                    <Select value={nowTime} onValueChange={setNowTime}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue
                          placeholder={intl.formatMessage({
                            id: 'case.timeSelect.placeholder',
                          })}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions?.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {nowMode === 'time' && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setNowTimes(timeOptions || [])}
                      >
                        <FormattedMessage id="case.timeSelect.selectAll" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setNowTimes([])}
                      >
                        <FormattedMessage id="case.timeSelect.clear" />
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-sm p-1.5 space-y-1">
                      {timeOptions?.map((time) => (
                        <div
                          key={time}
                          className="flex items-center space-x-1.5"
                        >
                          <Checkbox
                            id={`time-${time}`}
                            checked={nowTimes.includes(time)}
                            className="h-3.5 w-3.5"
                            onCheckedChange={(checked) => {
                              if (checked)
                                setNowTimes((prev) => [...prev, time]);
                              else
                                setNowTimes((prev) =>
                                  prev.filter((t) => t !== time),
                                );
                            }}
                          />
                          <Label
                            htmlFor={`time-${time}`}
                            className="text-[11px] text-gray-600"
                          >
                            {time}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      <FormattedMessage
                        id="case.timeSelect.selected"
                        values={{ count: nowTimes.length }}
                      />
                    </div>
                  </div>
                )}
                {nowMode === 'case' && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="text-[10px] font-medium text-gray-500">
                      <FormattedMessage id="case.caseSelect.title" />
                    </div>
                    {successCases.length === 0 ? (
                      <div className="text-[10px] text-gray-400">
                        <FormattedMessage id="case.caseSelect.empty" />
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto border rounded-sm p-1.5 space-y-2">
                        {successCases.map((item) => {
                          const id = item.id;
                          if (id == null) return null;
                          const selected = nowCases.some((c) => c.caseId === id);
                          const selectedEntry = nowCases.find(
                            (c) => c.caseId === id,
                          );
                          const timesForCase = getTimesForCase(id);
                          const isLoadingTimes =
                            loadingCaseTimesIds.includes(id);
                          return (
                            <div
                              key={id}
                              className="space-y-1.5 border-b border-gray-50 last:border-0 pb-1.5 last:pb-0"
                            >
                              <div className="flex items-start space-x-1.5">
                                <Checkbox
                                  id={`case-${id}`}
                                  checked={selected}
                                  className="h-3.5 w-3.5 mt-0.5"
                                  onCheckedChange={(checked) => {
                                    toggleCaseSelection(id, Boolean(checked));
                                  }}
                                />
                                <Label
                                  htmlFor={`case-${id}`}
                                  className="text-[11px] text-gray-700 leading-snug cursor-pointer"
                                >
                                  <span className="font-medium">
                                    #{item.caseId}
                                  </span>
                                  {id === caseId && (
                                    <span className="ml-1 text-[10px] text-[var(--office-blue)]">
                                      (
                                      <FormattedMessage id="case.caseSelect.current" />
                                      )
                                    </span>
                                  )}
                                  {item.comment ? (
                                    <span className="block text-gray-500 truncate max-w-[160px]">
                                      {item.comment}
                                    </span>
                                  ) : null}
                                </Label>
                              </div>
                              {selected && (
                                <div className="ml-5 space-y-1">
                                  {isLoadingTimes ? (
                                    <div className="text-[10px] text-gray-400">
                                      <FormattedMessage id="case.caseSelect.loadingTimes" />
                                    </div>
                                  ) : timesForCase.length === 0 ? (
                                    <div className="text-[10px] text-gray-400">
                                      <FormattedMessage id="case.caseSelect.noTimes" />
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-5 text-[9px] px-1.5"
                                          onClick={() =>
                                            updateCaseTimes(id, timesForCase)
                                          }
                                        >
                                          <FormattedMessage id="case.timeSelect.selectAll" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-5 text-[9px] px-1.5"
                                          onClick={() =>
                                            updateCaseTimes(id, [])
                                          }
                                        >
                                          <FormattedMessage id="case.timeSelect.clear" />
                                        </Button>
                                      </div>
                                      <div className="max-h-28 overflow-y-auto space-y-1">
                                        {timesForCase.map((time) => (
                                          <div
                                            key={`${id}-${time}`}
                                            className="flex items-center space-x-1.5"
                                          >
                                            <Checkbox
                                              id={`case-${id}-time-${time}`}
                                              checked={
                                                selectedEntry?.times.includes(
                                                  time,
                                                ) ?? false
                                              }
                                              className="h-3.5 w-3.5"
                                              onCheckedChange={(checked) => {
                                                toggleCaseTime(
                                                  id,
                                                  time,
                                                  Boolean(checked),
                                                );
                                              }}
                                            />
                                            <Label
                                              htmlFor={`case-${id}-time-${time}`}
                                              className="text-[11px] text-gray-600"
                                            >
                                              {time}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400">
                      <FormattedMessage
                        id="case.caseSelect.selected"
                        values={{ count: nowCases.length }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Axis Selection (non-eq2D) */}
          {!isEq2D && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-700">
                <FormattedMessage id="case.axis.title" />
              </div>
              <div className="px-3 pb-3 space-y-2">
                <div>
                  <Label className="text-[10px] text-gray-500">
                    <FormattedMessage id="case.axis.xLabel" />
                  </Label>
                  <Select value={nowX} onValueChange={setNowX}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue
                        placeholder={intl.formatMessage({
                          id: 'case.axis.xPlaceholder',
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {headerOptions?.map((h) => (
                        <SelectItem key={h} value={h} className="text-xs">
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">
                    <FormattedMessage id="case.axis.yLabel" />
                  </Label>
                  <Select value={nowY} onValueChange={setNowY}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue
                        placeholder={intl.formatMessage({
                          id: 'case.axis.yPlaceholder',
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {headerOptions?.map((h) => (
                        <SelectItem key={h} value={h} className="text-xs">
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {isEq2D && (
            <div className="px-3 py-2">
              <div className="flex items-start gap-1.5 text-[10px] text-gray-500 bg-blue-50 p-2 rounded-sm">
                <Info className="w-3 h-3 text-[var(--office-blue)] shrink-0 mt-0.5" />
                <span>
                  <FormattedMessage id="case.eq2D.info" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right - Chart Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Chart Title */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                {isEq2D
                  ? intl.formatMessage({ id: 'case.chart.title.equilibrium' })
                  : appliedExpression && nowX
                    ? `${appliedExpression} vs ${nowX}`
                    : nowY
                      ? `${nowY} vs ${nowX}`
                      : intl.formatMessage({ id: 'case.chart.title.plot' })}
              </h3>
              {displayTime && (
                <p className="text-[10px] text-gray-500">
                  t = {displayTime} |{' '}
                  {typeOptions.find((t) => t.value === nowType)?.label}
                </p>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 relative" ref={chartContainerRef}>
            {effectiveIsPlotLoading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                <div className="text-xs text-gray-500 animate-pulse">
                  <FormattedMessage id="case.chart.loading" />
                </div>
              </div>
            )}
            {echartsOption ? (
              <ReactECharts
                key={chartRenderer}
                option={echartsOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: chartRenderer }}
                // 1D: merge series data to reduce flicker; eq2D: replace (contour count can change).
                notMerge={animationActive && isEq2D}
                lazyUpdate={animationActive}
                onChartReady={handleSvgChartReady}
              />
            ) : (
              showNoData && (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  <FormattedMessage id="case.chart.noData" />
                </div>
              )
            )}
          </div>

          {/* Bottom - Expression Bar (like Excel formula bar) */}
          {!isEq2D && (
            <div className="h-9 border-t border-gray-200 bg-white flex items-center px-3 gap-2 shrink-0">
              <div className="flex items-center gap-1 text-[10px] text-gray-500 shrink-0">
                <span className="font-medium">X:</span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded-sm">
                  {nowX || '-'}
                </span>
                <span className="font-medium ml-2">Y:</span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded-sm">
                  {nowY || '-'}
                </span>
              </div>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <span
                className="text-[10px] text-gray-500 shrink-0 max-w-[220px] truncate"
                title={expressionMappingHint || undefined}
              >
                {expressionMappingHint
                  ? expressionMappingHint
                  : intl.formatMessage({ id: 'case.expression.mapping' })}
              </span>
              <Select
                value={variableToInsert}
                onValueChange={insertExpressionVariable}
              >
                <SelectTrigger className="h-6 w-36 shrink-0 text-[10px]">
                  <SelectValue
                    placeholder={intl.formatMessage({
                      id: 'case.expression.variables',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {formulaVariables.map((variable) => (
                    <SelectItem
                      key={variable.alias}
                      value={variable.alias}
                      className="text-xs"
                    >
                      {variable.header} ({variable.alias})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                ref={expressionInputRef}
                className="flex-1 h-6 text-xs border-gray-300"
                placeholder={intl.formatMessage({
                  id: 'case.expression.placeholder',
                })}
                value={yExpression}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setYExpression(e.target.value);
                  setExpressionError('');
                }}
              />
              <Button
                size="sm"
                className="h-6 text-[10px] px-3 bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)]"
                onClick={() => {
                  if (!yExpression.trim()) {
                    setAppliedExpression('');
                    setExpressionError('');
                    return;
                  }
                  try {
                    parseExpression(yExpression, expressionVariables);
                    setAppliedExpression(yExpression);
                    setExpressionError('');
                  } catch (err) {
                    setExpressionError(
                      `Error: ${err instanceof Error ? err.message : 'Invalid'}`,
                    );
                  }
                }}
              >
                <FormattedMessage id="case.expression.apply" />
              </Button>
              {appliedExpression && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] px-2"
                  onClick={() => {
                    setYExpression('');
                    setAppliedExpression('');
                    setExpressionError('');
                  }}
                >
                  <FormattedMessage id="case.expression.clear" />
                </Button>
              )}
              {expressionError && (
                <span className="text-[10px] text-red-500 shrink-0">
                  {expressionError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - AI Case Assistant */}
        {aiEnabled && aiOpen && (
          <aside className="w-[380px] shrink-0 border-l border-gray-200 bg-white p-2">
            <CaseAssistant
              caseId={caseId}
              userId={userId}
              onApplyPlot={handleApplyPlot}
              onRerunWithChanges={
                canRerunWithChanges ? handleRerunWithChanges : undefined
              }
              onClose={() => setAiOpen(false)}
            />
          </aside>
        )}
      </div>

      {/* Image Format Dialog */}
      <Dialog
        open={imageFormatDialogOpen}
        onOpenChange={setImageFormatDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <FormattedMessage id="case.dialog.imageFormat" />
            </DialogTitle>
          </DialogHeader>
          <RadioGroup
            value={selectedImageFormat}
            onValueChange={(v) =>
              setSelectedImageFormat(v as 'png' | 'svg' | 'jpeg')
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="png" id="png" />
              <Label htmlFor="png">
                <FormattedMessage id="case.dialog.png" />
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="svg" id="svg" />
              <Label htmlFor="svg">
                <FormattedMessage id="case.dialog.svg" />
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="jpeg" id="jpeg" />
              <Label htmlFor="jpeg">
                <FormattedMessage id="case.dialog.jpeg" />
              </Label>
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImageFormatDialogOpen(false)}
            >
              <FormattedMessage id="case.dialog.cancel" />
            </Button>
            <Button onClick={handleImageFormatConfirm}>
              <FormattedMessage id="case.dialog.download" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Historical Execution Log Dialog */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="w-[94vw] max-w-[1440px] h-[88vh] max-h-[88vh] p-0 overflow-hidden flex flex-col sm:max-w-[1440px]">
          <DialogHeader className="px-6 py-3.5 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-sky-500" />
              算例 #{caseData?.caseId || caseId} 运行与计算日志
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 flex-1 overflow-hidden flex flex-col min-h-0">
            <CaseLogTerminal
              logs={displayLogs}
              logsByFile={displayLogsByFile}
              availableFiles={displayAvailableFiles}
              status={isHistoricalLogsLoading ? 'connecting' : 'completed'}
              isCompleted={true}
              isSuccess={caseData?.status === 'success'}
              isTerminated={caseData?.status === 'terminated'}
              caseId={caseId}
              maxHeight="h-full flex-1"
              className="flex-1 h-full min-h-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Case;
