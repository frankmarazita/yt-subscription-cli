import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { videosQueryKey } from "./useVideosQuery";
import { historyQueryKey } from "./useHistoryQuery";
import { watchLaterQueryKey } from "./useWatchLater";
import { getApiBaseUrl } from "../services/api-client";

const QUERY_KEYS: Record<string, readonly string[]> = {
  videos: videosQueryKey,
  history: historyQueryKey,
  watchLater: watchLaterQueryKey,
};

const RECONNECT_DELAY_MS = 3000;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const baseUrl = getApiBaseUrl().replace(/^http/, "ws");
      const ws = new WebSocket(baseUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const key = QUERY_KEYS[String(event.data)];
        if (key) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      };

      ws.onclose = () => {
        if (!unmountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [queryClient]);
}
