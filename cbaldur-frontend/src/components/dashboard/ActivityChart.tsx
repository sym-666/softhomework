import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { graphic } from 'echarts';
import { useIntl } from 'react-intl';
import type { DailyActivity } from '@/redux/api/dashboard';

/** 从上到下渐隐的面积填充 */
function fade(color: string) {
  return new graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `${color}55` },
    { offset: 1, color: `${color}05` },
  ]);
}

export default function ActivityChart({
  activity,
}: {
  activity: DailyActivity[];
}) {
  const intl = useIntl();
  const papersLabel = intl.formatMessage({ id: 'dashboard.activityPapers' });
  const notesLabel = intl.formatMessage({ id: 'dashboard.activityNotes' });

  const option = useMemo(
    () => ({
      tooltip: { trigger: 'axis' as const },
      legend: {
        data: [papersLabel, notesLabel],
        top: 0,
        right: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: '#4a5468' },
      },
      grid: { left: 30, right: 12, top: 34, bottom: 25 },
      xAxis: {
        type: 'category' as const,
        boundaryGap: false,
        data: activity.map((item) => item.date.slice(5)),
        axisLine: { lineStyle: { color: '#1f2a44' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: '#8a8173' },
      },
      yAxis: {
        type: 'value' as const,
        minInterval: 1,
        splitLine: { lineStyle: { color: '#ebe4d6', type: 'dashed' as const } },
        axisLabel: { fontSize: 10, color: '#8a8173' },
      },
      series: [
        {
          name: papersLabel,
          type: 'line' as const,
          smooth: true,
          symbolSize: 6,
          data: activity.map((item) => item.papers),
          lineStyle: { width: 2.5, color: '#2f4a7a' },
          itemStyle: { color: '#2f4a7a' },
          areaStyle: { color: fade('#2f4a7a') },
        },
        {
          name: notesLabel,
          type: 'line' as const,
          smooth: true,
          symbolSize: 6,
          data: activity.map((item) => item.notes),
          lineStyle: { width: 2.5, color: '#b8432f' },
          itemStyle: { color: '#b8432f' },
          areaStyle: { color: fade('#b8432f') },
        },
      ],
    }),
    [activity, papersLabel, notesLabel],
  );

  return (
    <ReactECharts option={option} style={{ height: 260, width: '100%' }} />
  );
}
