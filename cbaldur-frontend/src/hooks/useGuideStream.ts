import { useCallback, useEffect, useRef, useState } from 'react';
import { parseSseChunk } from '@/hooks/useAiChatStream';

export type GuideResult = 'completed' | 'stopped' | 'failed';

/** 流式接收导读文本；与对话不同，这里只有一段内容，没有消息列表 */
export function useGuideStream(errorText: string) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(
    async (url: string): Promise<GuideResult> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setContent('');
      setError(null);
      setIsGenerating(true);

      try {
        const response = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          const json = await response.json().catch(() => null);
          setError(json?.message ?? errorText);
          return 'failed';
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let failed = false;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSseChunk(buffer);
          buffer = parsed.rest;
          for (const event of parsed.events) {
            const data = JSON.parse(event.data);
            if (event.event === 'delta') {
              setContent((current) => current + (data.text ?? ''));
            } else if (event.event === 'error') {
              failed = true;
              setError(data.message ?? errorText);
            }
          }
        }
        return failed ? 'failed' : 'completed';
      } catch (caught) {
        if ((caught as Error)?.name === 'AbortError') return 'stopped';
        setError(errorText);
        return 'failed';
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsGenerating(false);
        }
      }
    },
    [errorText],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => setContent(''), []);

  return { content, isGenerating, error, generate, stop, clear };
}
