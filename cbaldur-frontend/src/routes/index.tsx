import { useMemo } from 'react';
import { Link } from 'wouter';
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
  Activity,
  CheckCircle2,
  AlertCircle,
  Zap,
  Bell,
  TrendingUp,
  TrendingDown,
  Server,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useGetCasesQuery, type CaseListItem } from '@/redux/api/case';
import { useGetNoticesQuery } from '@/redux/api/notice';
import ReactECharts from 'echarts-for-react';
import { FormattedMessage, useIntl } from 'react-intl';

type CaseData = Pick<
  CaseListItem,
  'id' | 'caseId' | 'createdAt' | 'status' | 'comment'
>;

const padZero = (num: number) => (num < 10 ? `0${num}` : num);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
};

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('finish') || s.includes('success') || s.includes('complete'))
    return 'bg-green-500 hover:bg-green-600';
  if (s.includes('fail') || s.includes('error'))
    return 'bg-red-500 hover:bg-red-600';
  if (s.includes('run') || s.includes('process'))
    return 'bg-blue-500 hover:bg-blue-600';
  return 'bg-gray-500 hover:bg-gray-600';
};

const getStatusLabel = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('finish') || s.includes('success') || s.includes('complete')) return 'COMPLETED';
  if (s.includes('fail') || s.includes('error')) return 'FAILED';
  if (s.includes('run') || s.includes('process')) return 'RUNNING';
  return status?.toUpperCase() || 'UNKNOWN';
};

const CaseChart = ({ cases }: { cases: CaseData[] }) => {
  const intl = useIntl();
  const completedLabel = intl.formatMessage({ id: 'dashboard.chart.legend.completed' });
  const runningLabel = intl.formatMessage({ id: 'dashboard.chart.legend.running' });
  const chartOption = useMemo(() => {
    if (!cases || cases.length === 0) return null;

    const result: { [key: string]: { completed: number; running: number } } = {};
    cases.forEach((item) => {
      const date = new Date(item.createdAt);
      const dateStr = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
      if (!result[dateStr]) result[dateStr] = { completed: 0, running: 0 };
      const s = item.status?.toLowerCase() || '';
      if (s.includes('finish') || s.includes('success') || s.includes('complete')) {
        result[dateStr].completed += 1;
      } else if (s.includes('run') || s.includes('process')) {
        result[dateStr].running += 1;
      } else {
        result[dateStr].completed += 1;
      }
    });

    const sorted = Object.keys(result)
      .map((key) => ({
        time: key,
        completed: result[key].completed,
        running: result[key].running,
        date: new Date(key),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const dates = sorted.map(({ time }) => time);
    const completed = sorted.map(({ completed }) => completed);
    const running = sorted.map(({ running }) => running);

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
      },
      legend: {
        data: [completedLabel, runningLabel],
        top: 5,
        right: 10,
        textStyle: { fontSize: 11 },
      },
      grid: { left: 40, right: 20, top: 35, bottom: 55 },
      xAxis: {
        type: 'category' as const,
        data: dates,
        axisLabel: { rotate: 45, fontSize: 10 },
      },
      yAxis: {
        type: 'value' as const,
        minInterval: 1,
      },
      series: [
        {
          name: completedLabel,
          type: 'line' as const,
          data: completed,
          areaStyle: { opacity: 0.15, color: '#0078d4' },
          lineStyle: { width: 2, color: '#0078d4' },
          itemStyle: { color: '#0078d4' },
          smooth: true,
        },
        {
          name: runningLabel,
          type: 'line' as const,
          data: running,
          areaStyle: { opacity: 0.1, color: '#50b5e9' },
          lineStyle: { width: 2, color: '#50b5e9' },
          itemStyle: { color: '#50b5e9' },
          smooth: true,
        },
      ],
    };
  }, [cases, completedLabel, runningLabel]);

  return (
    <div className="w-full h-[300px] overflow-hidden">
      {chartOption && cases.length > 0 ? (
        <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No chart data available
        </div>
      )}
    </div>
  );
};

function NoticeIcon({ type }: { type: string }) {
  if (type === 'maintenance') return <Server className="w-4 h-4 text-[var(--office-blue)]" />;
  if (type === 'update') return <Info className="w-4 h-4 text-green-600" />;
  if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <Bell className="w-4 h-4 text-gray-500" />;
}

export default function Dashboard() {
  const { data: cases = [], isLoading: isCasesLoading } = useGetCasesQuery({});
  const { data: notices = [], isLoading: isNoticesLoading } = useGetNoticesQuery();

  const systemNotices = useMemo(
    () => notices.filter((n: any) => !n.organizationId),
    [notices],
  );
  const orgNotices = useMemo(
    () => notices.filter((n: any) => n.organizationId),
    [notices],
  );

  const stats = useMemo(() => {
    const total = cases.length;
    const completed = cases.filter(
      (c: CaseData) =>
        c.status?.toLowerCase().includes('finish') ||
        c.status?.toLowerCase().includes('success'),
    ).length;
    const running = cases.filter(
      (c: CaseData) =>
        c.status?.toLowerCase().includes('run') ||
        c.status?.toLowerCase().includes('process'),
    ).length;
    const failed = cases.filter(
      (c: CaseData) =>
        c.status?.toLowerCase().includes('fail') ||
        c.status?.toLowerCase().includes('error'),
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, running, failed, completionRate };
  }, [cases]);

  const recentCases = useMemo(() => {
    return [...cases]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 8);
  }, [cases]);

  if (isCasesLoading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="text-sm animate-pulse text-gray-500"><FormattedMessage id="dashboard.loading" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Stats Cards - Office-style metric boxes */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider"><FormattedMessage id="dashboard.stats.total" /></span>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-3xl font-semibold text-gray-900">{stats.total.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-600"><FormattedMessage id="dashboard.stats.active" /></span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider"><FormattedMessage id="dashboard.stats.completed" /></span>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-3xl font-semibold text-gray-900">{stats.completed.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1"><FormattedMessage id="dashboard.stats.completionRate" values={{ rate: stats.completionRate }} /></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider"><FormattedMessage id="dashboard.stats.running" /></span>
            <div className="relative">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{stats.running}</div>
          <div className="text-xs text-[var(--office-blue)] mt-1"><FormattedMessage id="dashboard.stats.activeNodes" /></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider"><FormattedMessage id="dashboard.stats.failed" /></span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-3xl font-semibold text-gray-900">{stats.failed}</div>
          {stats.failed > 0 ? (
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-500"><FormattedMessage id="dashboard.stats.needsAttention" /></span>
            </div>
          ) : (
            <div className="text-xs text-green-600 mt-1"><FormattedMessage id="dashboard.stats.allClear" /></div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart - Simulation Volume Trend */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800"><FormattedMessage id="dashboard.chart.title" /></h3>
              <p className="text-xs text-gray-500 mt-0.5"><FormattedMessage id="dashboard.chart.subtitle" /></p>
            </div>
          </div>
          <div className="p-3">
            <CaseChart cases={cases} />
          </div>
        </div>

        {/* System Notices */}
        <div className="bg-white border border-gray-200 rounded-sm flex flex-col max-h-[420px]">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800"><FormattedMessage id="dashboard.notices.system" /></h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isNoticesLoading ? (
              <div className="text-center text-gray-400 py-4 text-xs"><FormattedMessage id="common.loading" /></div>
            ) : (
              <>
                {systemNotices.map((notice: any) => (
                  <div key={notice.id} className="flex gap-2.5 p-2 rounded-sm hover:bg-gray-50">
                    <NoticeIcon type={notice.type || 'info'} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-800 truncate">{notice.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notice.content}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatDate(notice.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {orgNotices.map((notice: any) => (
                  <div key={notice.id} className="flex gap-2.5 p-2 rounded-sm hover:bg-gray-50">
                    <NoticeIcon type={notice.type || 'info'} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-800 truncate">{notice.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notice.content}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatDate(notice.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {systemNotices.length === 0 && orgNotices.length === 0 && (
                  <div className="text-center text-gray-400 py-4 text-xs"><FormattedMessage id="dashboard.notices.empty" /></div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800"><FormattedMessage id="dashboard.recentCases.title" /></h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-[var(--office-blue)] h-7" asChild>
            <Link href="/cases"><FormattedMessage id="dashboard.recentCases.viewAll" /></Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600"><FormattedMessage id="dashboard.recentCases.caseId" /></TableHead>
              <TableHead className="text-xs font-semibold text-gray-600"><FormattedMessage id="dashboard.recentCases.description" /></TableHead>
              <TableHead className="text-xs font-semibold text-gray-600"><FormattedMessage id="dashboard.recentCases.status" /></TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right"><FormattedMessage id="dashboard.recentCases.dateSubmitted" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentCases.map((c) => (
              <TableRow key={c.id} className="hover:bg-[var(--office-blue-light)]/30">
                <TableCell className="font-medium text-xs text-[var(--office-blue)]">#{c.caseId}</TableCell>
                <TableCell className="text-xs text-gray-600 max-w-[300px] truncate">
                  {c.comment || '-'}
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(c.status)} text-white text-[10px] px-2`}>
                    {getStatusLabel(c.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-gray-500">
                  {formatDate(c.createdAt)}
                </TableCell>
              </TableRow>
            ))}
            {recentCases.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 text-xs">
                  <FormattedMessage id="dashboard.recentCases.noCases" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
