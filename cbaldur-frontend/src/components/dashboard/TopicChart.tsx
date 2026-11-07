import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import type { Paper } from '@/types/paper';
import { CHART_COLORS } from '@/utils/palette';

const MAX_TOPICS = 7;
const OTHER_COLOR = '#b9b0a0';

interface Topic {
  name: string;
  value: number;
  color: string;
}

/**
 * 每篇论文按第一个标签归类，各部分之和等于论文数；类别过多时合并为“其他”。
 * 没有标签的论文也算进“其他”。
 */
export function countTopics(papers: Paper[], otherLabel: string): Topic[] {
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
    ...top.map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    })),
    ...(rest > 0
      ? [{ name: otherLabel, value: rest, color: OTHER_COLOR }]
      : []),
  ];
}

/** 研究方向：顶部比例条，下方逐项列出数量和占比 */
export default function TopicChart({ papers }: { papers: Paper[] }) {
  const intl = useIntl();
  const topics = useMemo(
    () =>
      countTopics(papers, intl.formatMessage({ id: 'dashboard.topicsOther' })),
    [papers, intl],
  );

  if (topics.length === 0) {
    return (
      <p className="flex h-[260px] items-center justify-center text-sm text-[var(--ink-soft)]">
        {intl.formatMessage({ id: 'dashboard.topicsEmpty' })}
      </p>
    );
  }

  const total = papers.length;
  const peak = Math.max(...topics.map((topic) => topic.value));
  return (
    <div className="h-[260px]">
      <div className="flex h-3 overflow-hidden rounded-[1px]">
        {topics.map((topic) => (
          <span
            key={topic.name}
            title={`${topic.name} ${topic.value}`}
            style={{
              width: `${(topic.value / total) * 100}%`,
              background: topic.color,
            }}
            className="border-r border-[var(--paper-card)] last:border-r-0"
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {topics.map((topic) => (
          <li
            key={topic.name}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3"
          >
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--ink)]">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
                    style={{ background: topic.color }}
                  />
                  <span className="truncate">{topic.name}</span>
                </span>
              </div>
              <div className="mt-1 h-[3px] bg-[#ece5d6]">
                <div
                  className="h-full"
                  style={{
                    width: `${(topic.value / peak) * 100}%`,
                    background: topic.color,
                  }}
                />
              </div>
            </div>
            <span className="w-14 text-right">
              <span className="font-serif text-base font-semibold text-[var(--ink)]">
                {topic.value}
              </span>
              <span className="ml-1 text-[11px] text-[var(--ink-soft)]">
                {Math.round((topic.value / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
