import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useIntl } from 'react-intl';
import type { DailyActivity } from '@/redux/api/dashboard';

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
        textStyle: { fontSize: 11 },
      },
      grid: { left: 30, right: 10, top: 30, bottom: 25 },
      xAxis: {
        type: 'category' as const,
        data: activity.map((item) => item.date.slice(5)),
        axisLabel: { fontSize: 10 },
      },
      yAxis: { type: 'value' as const, minInterval: 1 },
      series: [
        {
          name: papersLabel,
          type: 'bar' as const,
          data: activity.map((item) => item.papers),
          itemStyle: { color: '#0078d4' },
        },
        {
          name: notesLabel,
          type: 'bar' as const,
          data: activity.map((item) => item.notes),
          itemStyle: { color: '#50b5e9' },
        },
      ],
    }),
    [activity, papersLabel, notesLabel],
  );

  return (
    <ReactECharts option={option} style={{ height: 260, width: '100%' }} />
  );
}
