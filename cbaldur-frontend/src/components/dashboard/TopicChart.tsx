import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useIntl } from 'react-intl';
import type { Paper } from '@/types/paper';
import { CHART_COLORS } from '@/utils/palette';

const MAX_TOPICS = 7;

const OTHER_COLOR = '#cbd5e1';

/**
 * 每篇论文按第一个标签归类，各部分之和等于论文数；类别过多时合并为“其他”。
 * 没有标签的论文也算进“其他”。
 */
export function countTopics(papers: Paper[], otherLabel: string) {
  const counts = new Map<string, number>();
  let untagged = 0;
  for (const paper of papers) {
    const topic = paper.tags[0];
    if (topic) counts.set(topic, (counts.get(topic) ?? 0) + 1);
    else untagged += 1;
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, MAX_TOPICS);
  const rest =
    untagged +
    sorted.slice(MAX_TOPICS).reduce((sum, [, count]) => sum + count, 0);
  return [
    ...top.map(([name, value]) => ({ name, value })),
    ...(rest > 0
      ? [{ name: otherLabel, value: rest, itemStyle: { color: OTHER_COLOR } }]
      : []),
  ];
}

export default function TopicChart({ papers }: { papers: Paper[] }) {
  const intl = useIntl();
  const data = useMemo(
    () =>
      countTopics(papers, intl.formatMessage({ id: 'dashboard.topicsOther' })),
    [papers, intl],
  );

  if (data.length === 0) {
    return (
      <p className="flex h-[260px] items-center justify-center text-sm text-gray-400">
        {intl.formatMessage({ id: 'dashboard.topicsEmpty' })}
      </p>
    );
  }

  const option = {
    color: CHART_COLORS,
    tooltip: { trigger: 'item' as const, formatter: '{b}：{c}' },
    legend: {
      orient: 'vertical' as const,
      right: 0,
      top: 'middle' as const,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 11, color: '#4b5563' },
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['48%', '74%'],
        center: ['34%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 },
        label: {
          show: true,
          position: 'center' as const,
          formatter: () => `${papers.length}`,
          fontSize: 26,
          fontWeight: 'bold' as const,
          color: '#111827',
        },
        emphasis: { scale: true, scaleSize: 6 },
        data,
      },
    ],
  };

  return (
    <ReactECharts option={option} style={{ height: 260, width: '100%' }} />
  );
}
