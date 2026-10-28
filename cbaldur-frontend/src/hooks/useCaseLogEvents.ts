import { useState, useEffect, useRef, useCallback } from 'react';

export interface CaseLogEventPayload {
  caseId: string;
  line: string;
  timestamp: string;
  isCompleted: boolean;
  isSuccess: boolean;
  errorMessage?: string | null;
  file?: string | null;
}

export type LogConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'disconnected';

interface UseCaseLogEventsOptions {
  caseId?: string;
  userId?: string;
  enabled?: boolean;
  initialLogs?: string;
  initialLogsByFile?: Record<string, string>;
  initialFiles?: string[];
  onCompleted?: (isSuccess: boolean, errorMessage?: string | null) => void;
}

export function useCaseLogEvents({
  caseId,
  userId,
  enabled = true,
  initialLogs = '',
  initialLogsByFile,
  initialFiles,
  onCompleted,
}: UseCaseLogEventsOptions) {
  const [logs, setLogs] = useState<string[]>(() =>
    initialLogs ? initialLogs.split('\n') : [],
  );
  const [logsByFile, setLogsByFile] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    if (initialLogsByFile) {
      for (const [k, v] of Object.entries(initialLogsByFile)) {
        map[k] = v.split('\n');
      }
    }
    return map;
  });
  const [availableFiles, setAvailableFiles] = useState<string[]>(() => {
    const files = new Set<string>(['all']);
    if (initialFiles) {
      initialFiles.forEach((f) => files.add(f));
    }
    if (initialLogsByFile) {
      Object.keys(initialLogsByFile).forEach((f) => files.add(f));
    }
    return Array.from(files);
  });

  const [status, setStatus] = useState<LogConnectionStatus>('idle');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceRef = useRef<EventSource | null>(null);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  // Sync initialLogs / initialLogsByFile if provided later
  useEffect(() => {
    if (initialLogs && logs.length === 0) {
      setLogs(initialLogs.split('\n'));
    }
  }, [initialLogs, logs.length]);

  useEffect(() => {
    if (initialLogsByFile && Object.keys(initialLogsByFile).length > 0) {
      setLogsByFile((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const map: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(initialLogsByFile)) {
          map[k] = v.split('\n');
        }
        return map;
      });
      setAvailableFiles((prev) => {
        const files = new Set<string>(prev);
        Object.keys(initialLogsByFile).forEach((f) => files.add(f));
        return Array.from(files);
      });
    }
  }, [initialLogsByFile]);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setAvailableFiles((prev) => {
        const files = new Set<string>(prev);
        initialFiles.forEach((f) => files.add(f));
        return Array.from(files);
      });
    }
  }, [initialFiles]);

  const clearLogs = useCallback((file?: string) => {
    if (!file || file === 'all') {
      setLogs([]);
      setLogsByFile({});
    } else {
      setLogsByFile((prev) => ({
        ...prev,
        [file]: [],
      }));
    }
  }, []);

  const connect = useCallback(() => {
    if (!caseId || !enabled) {
      return;
    }

    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }

    setStatus('connecting');
    const params = new URLSearchParams({ id: caseId });
    if (userId) {
      params.append('userId', userId);
    }
    const url = `/api/Case/LogEvents?${params.toString()}`;

    const source = new EventSource(url, { withCredentials: true });
    sourceRef.current = source;

    source.onopen = () => {
      setStatus('streaming');
    };

    const pendingLines: Array<{ line: string; fileKey: string }> = [];
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushLogs = () => {
      if (pendingLines.length === 0) return;
      const batch = pendingLines.splice(0, pendingLines.length);
      const newLines = batch.map((b) => b.line);
      const newFiles = new Set<string>();

      setLogs((prev) => [...prev, ...newLines]);
      setLogsByFile((prev) => {
        const next = { ...prev };
        for (const item of batch) {
          if (!next[item.fileKey]) {
            next[item.fileKey] = [];
          }
          next[item.fileKey].push(item.line);
          newFiles.add(item.fileKey);
        }
        return next;
      });
      setAvailableFiles((prev) => {
        let changed = false;
        const current = new Set(prev);
        for (const f of newFiles) {
          if (!current.has(f)) {
            current.add(f);
            changed = true;
          }
        }
        return changed ? Array.from(current) : prev;
      });
    };

    const handleCaseLog = (e: MessageEvent) => {
      try {
        const data: CaseLogEventPayload = JSON.parse(e.data);
        if (data.line) {
          const line = data.line;
          const fileKey = data.file?.trim() || 'pipeline';
          pendingLines.push({ line, fileKey });

          if (!flushTimer) {
            flushTimer = setTimeout(() => {
              flushTimer = null;
              flushLogs();
            }, 60);
          }
        }

        if (data.isCompleted) {
          if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
          }
          flushLogs();

          setIsCompleted(true);
          setIsSuccess(data.isSuccess);
          setErrorMessage(data.errorMessage ?? null);
          setStatus(data.isSuccess ? 'completed' : 'failed');
          source.close();
          sourceRef.current = null;
          onCompletedRef.current?.(data.isSuccess, data.errorMessage);
        }
      } catch (err) {
        console.error('Failed to parse case log SSE message:', err);
      }
    };

    source.addEventListener('case-log', handleCaseLog);

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        flushLogs();
        setStatus((prev) =>
          prev === 'completed' || prev === 'failed' ? prev : 'disconnected',
        );
        source.removeEventListener('case-log', handleCaseLog);
        source.close();
        if (sourceRef.current === source) {
          sourceRef.current = null;
        }
      }
    };
  }, [caseId, userId, enabled]);

  useEffect(() => {
    if (!enabled || !caseId) {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      setStatus('idle');
      return;
    }

    connect();

    return () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };
  }, [caseId, userId, enabled, connect]);

  return {
    logs,
    logsByFile,
    availableFiles,
    status,
    isCompleted,
    isSuccess,
    errorMessage,
    clearLogs,
    reconnect: connect,
  };
}
