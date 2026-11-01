import { useCallback, useEffect, useRef, useState } from 'react';
import type { AiChatItem, AiChatMessage, Citation } from '@/types/Ai';

/** 与后端保持一致：每次只发送最近 12 条历史 */
const MAX_HISTORY = 12;

interface UseAiChatStreamOptions {
  /** POST 地址，例如 /api/Ai/PaperChat?id=... */
  url: string;
  /** 组装请求体；history 已截断为最近 12 条 */
  buildBody: (message: string, history: AiChatMessage[]) => unknown;
  errorText: string;
}

interface SseEvent {
  event: string;
  data: string;
}

/** 解析 SSE 文本块，返回完整事件与剩余未完成的缓冲 */
export function parseSseChunk(buffer: string): {
  events: SseEvent[];
  rest: string;
} {
  const events: SseEvent[] = [];
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() ?? '';
  for (const block of blocks) {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith(':')) continue;
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (data.length > 0) events.push({ event, data: data.join('\n') });
  }
  return { events, rest };
}

let idSeed = 0;
const nextId = () => `ai-${Date.now()}-${idSeed++}`;

/**
 * AI 助手流式对话：POST + fetch 读取 SSE（EventSource 只支持 GET）
 * 历史只保存在组件内存中，刷新即清空。
 */
export function useAiChatStream({
  url,
  buildBody,
  errorText,
}: UseAiChatStreamOptions) {
  const [items, setItems] = useState<AiChatItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  /** 单调递增的会话/请求代次：切换 URL、reset 与新请求都会推进 */
  const generationRef = useRef(0);
  /** items 当前所属的会话 URL，用于在 effect 执行前识别 URL 切换 */
  const sessionUrlRef = useRef(url);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const buildBodyRef = useRef(buildBody);
  buildBodyRef.current = buildBody;

  /** 开启新会话：中止旧请求并清空历史与流式状态 */
  const startNewSession = useCallback((currentUrl: string) => {
    sessionUrlRef.current = currentUrl;
    generationRef.current += 1;
    const controller = abortRef.current;
    abortRef.current = null;
    controller?.abort();
    itemsRef.current = [];
    setItems([]);
    setIsStreaming(false);
  }, []);

  // URL 变化（例如同一路由切换到另一篇论文）时作废旧会话，旧历史与旧流不得带入
  useEffect(() => {
    if (sessionUrlRef.current === url) return;
    startNewSession(url);
  }, [url, startNewSession]);

  // 组件卸载时终止流；推进代次，迟到的 finally 不再更新状态
  useEffect(
    () => () => {
      generationRef.current += 1;
      abortRef.current?.abort();
    },
    [],
  );

  const patchItem = useCallback(
    (id: string, patch: (item: AiChatItem) => AiChatItem) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? patch(item) : item)),
      );
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message) return;

      const targetUrl = url;
      // URL 已变化但重置 effect 尚未执行：同步作废旧会话，保证本次历史为空
      if (sessionUrlRef.current !== targetUrl) {
        startNewSession(targetUrl);
      } else if (abortRef.current) {
        return;
      }

      const history: AiChatMessage[] = itemsRef.current
        .filter((item) => !item.error && item.content.trim())
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }));

      const requestId = ++generationRef.current;
      const assistantId = nextId();
      setItems((prev) => [
        ...prev,
        { id: nextId(), role: 'user', content: message },
        { id: assistantId, role: 'assistant', content: '', streaming: true },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      // 只处理仍属于当前代次的事件；reset/URL 切换后旧事件不得写入新会话
      const patchActive = (patch: (item: AiChatItem) => AiChatItem) => {
        if (generationRef.current === requestId) {
          patchItem(assistantId, patch);
        }
      };

      const fail = (reason: string) =>
        patchActive((item) => ({
          ...item,
          content: item.content || reason,
          error: !item.content,
        }));

      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(buildBodyRef.current(message, history)),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          let reason = errorText;
          try {
            const json = await response.json();
            if (json?.message) reason = json.message;
          } catch {
            // 非 JSON 错误体
          }
          fail(reason);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSseChunk(buffer);
          buffer = parsed.rest;
          for (const evt of parsed.events) {
            const data = JSON.parse(evt.data);
            switch (evt.event) {
              case 'delta':
                patchActive((item) => ({
                  ...item,
                  content: item.content + (data.text ?? ''),
                }));
                break;
              case 'citations':
                patchActive((item) => ({
                  ...item,
                  citations: data as Citation[],
                }));
                break;
              case 'error':
                fail(data.message ?? errorText);
                break;
              default:
                break;
            }
          }
        }
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          fail(errorText);
        }
      } finally {
        // 旧请求只在自身仍是当前请求时收尾，不能覆盖新请求的 controller/状态
        if (generationRef.current === requestId) {
          patchItem(assistantId, (item) => ({
            ...item,
            streaming: false,
          }));
        }
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [url, errorText, patchItem, startNewSession],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    startNewSession(url);
  }, [url, startNewSession]);

  return { items, isStreaming, send, stop, reset };
}
