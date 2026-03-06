import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { videosQueryKey } from './useVideosQuery';
import { historyQueryKey } from './useHistoryQuery';
import { watchLaterQueryKey } from './useWatchLater';
import { useConfigStore } from '../store/configStore';

const QUERY_KEYS: Record<string, readonly string[]> = {
  videos: videosQueryKey,
  history: historyQueryKey,
  watchLater: watchLaterQueryKey,
};

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;
      const baseUrl = useConfigStore.getState().getActiveHost().replace(/^http/, 'ws');
      const ws = new WebSocket(baseUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const key = QUERY_KEYS[String(event.data)];
        if (key) queryClient.invalidateQueries({ queryKey: key });
      };

      ws.onclose = () => {
        if (!unmountedRef.current) timerRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [queryClient]);
}
