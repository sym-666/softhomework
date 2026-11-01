import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Loader2, Plus, Send, Square, X } from 'lucide-react';
import { Button } from '@/shadcn/components/ui/button';
import { Textarea } from '@/shadcn/components/ui/textarea';
import type { AiChatItem } from '@/types/Ai';

interface AiChatPanelProps {
  title: string;
  subtitle?: string;
  emptyText: string;
  items: AiChatItem[];
  isStreaming: boolean;
  shortcuts?: string[];
  onSend: (text: string) => void;
  onStop: () => void;
  onReset: () => void;
  onClose?: () => void;
  /** 在助手消息下方渲染结构化结果 */
  renderExtras?: (item: AiChatItem) => React.ReactNode;
  /** 标题栏下方的附加控件 */
  toolbar?: React.ReactNode;
  /** 外部填入输入框的内容；每次传入新对象都会填入一次 */
  draftRequest?: { text: string } | null;
  /** 重置按钮的说明，默认是“新对话” */
  resetLabel?: string;
}

/**
 * AI 助手对话面板：消息列表、快捷问题与输入框
 */
const AiChatPanel: React.FC<AiChatPanelProps> = ({
  title,
  subtitle,
  emptyText,
  items,
  isStreaming,
  shortcuts = [],
  onSend,
  onStop,
  onReset,
  onClose,
  renderExtras,
  toolbar,
  draftRequest,
  resetLabel,
}) => {
  const intl = useIntl();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  useEffect(() => {
    if (!draftRequest) return;
    setDraft(draftRequest.text);
    inputRef.current?.focus();
  }, [draftRequest]);

  const submit = () => {
    const text = draft.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-sm border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <Bot className="h-4 w-4 text-[var(--office-blue)]" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          {subtitle && (
            <div className="truncate text-xs text-gray-500">{subtitle}</div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={resetLabel ?? intl.formatMessage({ id: 'ai.newSession' })}
          aria-label={resetLabel ?? intl.formatMessage({ id: 'ai.newSession' })}
          onClick={onReset}
        >
          <Plus className="h-4 w-4" />
        </Button>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={intl.formatMessage({ id: 'ai.close' })}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {toolbar && (
        <div className="border-b border-gray-100 px-3 py-1.5">{toolbar}</div>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {items.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-500">
            {emptyText}
          </div>
        )}
        {items.map((item) =>
          item.role === 'user' ? (
            <div key={item.id} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-md bg-[var(--office-blue)] px-3 py-2 text-sm text-white">
                {item.content}
              </div>
            </div>
          ) : (
            <div key={item.id} className="space-y-2">
              <div
                className={`max-w-full rounded-md border px-3 py-2 text-sm ${
                  item.error
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-gray-50 text-gray-800'
                }`}
              >
                {item.content ? (
                  <div className="ai-markdown break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  item.streaming && (
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {intl.formatMessage({ id: 'ai.thinking' })}
                    </span>
                  )
                )}
              </div>
              {renderExtras?.(item)}
            </div>
          ),
        )}
      </div>

      <div className="space-y-2 border-t border-gray-100 p-3">
        {shortcuts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut}
                type="button"
                disabled={isStreaming}
                onClick={() => onSend(shortcut)}
                className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:border-[var(--office-blue)] hover:text-[var(--office-blue)] disabled:opacity-50"
              >
                {shortcut}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={draft}
            rows={2}
            placeholder={intl.formatMessage({ id: 'ai.inputPlaceholder' })}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                submit();
              }
            }}
            className="min-h-[60px] resize-none text-sm"
          />
          {isStreaming ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onStop}
              title={intl.formatMessage({ id: 'ai.stop' })}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={submit}
              disabled={!draft.trim()}
              title={intl.formatMessage({ id: 'ai.send' })}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiChatPanel;
