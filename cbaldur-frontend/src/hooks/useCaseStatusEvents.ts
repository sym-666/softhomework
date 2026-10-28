import { useEffect, useRef } from 'react';
import { caseApi } from '@/redux/api/case';
import { useAppDispatch } from '@/redux/hooks';

const STATUS_EVENTS_URL = '/api/Case/StatusEvents';

/**
 * Opens a single EventSource to case status SSE while authenticated.
 * On status events, invalidates RTK Case tags so GetCases refetches for /cases and home.
 */
export function useCaseStatusEvents(enabled: boolean) {
  const dispatch = useAppDispatch();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      sourceRef.current?.close();
      sourceRef.current = null;
      return;
    }

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoffMs = 1000;

    const connect = () => {
      if (cancelled) {
        return;
      }

      sourceRef.current?.close();
      // Same-origin /api proxy includes AuthToken cookie; withCredentials covers cross-origin deploys.
      const source = new EventSource(STATUS_EVENTS_URL, { withCredentials: true });
      sourceRef.current = source;

      const onStatusEvent = () => {
        backoffMs = 1000;
        dispatch(caseApi.util.invalidateTags(['Case']));
      };

      source.addEventListener('case-status', onStatusEvent);

      source.onopen = () => {
        backoffMs = 1000;
      };

      source.onerror = () => {
        // Browser EventSource auto-reconnects on transient errors; if the
        // connection is CLOSED (e.g. 401), close and back off manually.
        if (source.readyState === EventSource.CLOSED) {
          source.removeEventListener('case-status', onStatusEvent);
          source.close();
          if (sourceRef.current === source) {
            sourceRef.current = null;
          }
          if (!cancelled) {
            reconnectTimer = setTimeout(connect, backoffMs);
            backoffMs = Math.min(backoffMs * 2, 30000);
          }
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [enabled, dispatch]);
}
