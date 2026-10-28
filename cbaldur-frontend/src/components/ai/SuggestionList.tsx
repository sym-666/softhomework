import React, { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import type { AiChatItem, FieldValue, ProposedFieldChange } from '@/types/Ai';

const formatValue = (value: FieldValue | null | undefined) =>
  value === null || value === undefined ? '—' : JSON.stringify(value);

const suggestionKey = (itemId: string, index: number) => `${itemId}:${index}`;

/**
 * 参数建议的勾选与“已应用”状态（调参助手与算例助手共用）。默认全部勾选。
 */
export function useSuggestionSelection() {
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const toggle = useCallback(
    (key: string) =>
      setUnchecked((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      }),
    [],
  );

  /** 取出尚未应用的建议；onlySelected 时只取勾选项 */
  const pick = useCallback(
    (item: AiChatItem, onlySelected: boolean) =>
      (item.suggestions ?? [])
        .map((change, index) => ({
          change,
          key: suggestionKey(item.id, index),
        }))
        .filter(({ key }) => !applied.has(key))
        .filter(({ key }) => !onlySelected || !unchecked.has(key)),
    [applied, unchecked],
  );

  const markApplied = useCallback((keys: string[]) => {
    setApplied((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => next.add(key));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setUnchecked(new Set());
    setApplied(new Set());
  }, []);

  return { unchecked, applied, toggle, pick, markApplied, reset };
}

export type SuggestionSelection = ReturnType<typeof useSuggestionSelection>;

/**
 * 参数建议列表：panel.field 旧值 → 新值 + 理由，可勾选；底部操作按钮由调用方提供
 */
export const SuggestionList: React.FC<{
  item: AiChatItem;
  selection: SuggestionSelection;
  /** 仍有未应用的建议且回答结束时显示 */
  actions: React.ReactNode;
}> = ({ item, selection, actions }) => {
  const intl = useIntl();
  if (!item.suggestions?.length) return null;
  const pending = item.suggestions.some(
    (_, index) => !selection.applied.has(suggestionKey(item.id, index)),
  );

  return (
    <div className="rounded-md border border-[var(--office-blue)]/30 bg-[var(--office-blue-light)]/30 p-2">
      <div className="mb-1.5 text-xs font-semibold text-gray-700">
        {intl.formatMessage({ id: 'ai.param.suggestions' })}
      </div>
      <div className="space-y-1.5">
        {item.suggestions.map((change: ProposedFieldChange, index) => {
          const key = suggestionKey(item.id, index);
          const isApplied = selection.applied.has(key);
          return (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-2 rounded-sm bg-white p-1.5 text-xs"
            >
              <Checkbox
                className="mt-0.5"
                checked={isApplied || !selection.unchecked.has(key)}
                disabled={isApplied || item.streaming}
                onCheckedChange={() => selection.toggle(key)}
              />
              <div className="min-w-0 flex-1">
                <div className="break-all font-mono">
                  <span className="text-gray-500">{change.panelId}.</span>
                  <span className="font-semibold text-gray-800">
                    {change.fieldId}
                  </span>
                  {': '}
                  <span className="text-gray-500 line-through">
                    {formatValue(change.currentValue)}
                  </span>
                  {' → '}
                  <span className="text-[var(--office-blue)]">
                    {formatValue(change.suggestedValue)}
                  </span>
                  {isApplied && (
                    <span className="ml-1 rounded bg-green-100 px-1 text-[10px] text-green-700">
                      {intl.formatMessage({ id: 'ai.param.appliedTag' })}
                    </span>
                  )}
                </div>
                {change.reason && (
                  <div className="mt-0.5 text-gray-600">{change.reason}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {pending && !item.streaming && (
        <div className="mt-2 flex justify-end gap-2">{actions}</div>
      )}
    </div>
  );
};
