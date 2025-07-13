import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchVideos } from '../services/video-service.js';
import type { VideoItem, Subscription } from '../types.js';

interface VideoDataOptions {
  useCache: boolean;
  maxChannels?: number;
  includeShorts: boolean;
  autoRefreshInterval?: number; // in milliseconds, default 5 minutes
}

interface VideoDataState {
  videos: VideoItem[];
  subscriptions: Subscription[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  cacheAge: number; // minutes
  refreshProgress: { current: number; total: number };
  refreshStatus: string;
}

interface VideoDataActions {
  refresh: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

export function useVideoData(options: VideoDataOptions): VideoDataState & VideoDataActions {
  const { useCache, maxChannels, includeShorts, autoRefreshInterval = 5 * 60 * 1000 } = options;
  
  const [state, setState] = useState<VideoDataState>({
    videos: [],
    subscriptions: [],
    loading: true,
    refreshing: false,
    error: null,
    lastUpdated: null,
    cacheAge: 0,
    refreshProgress: { current: 0, total: 0 },
    refreshStatus: ''
  });
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(false);
  
  const loadData = useCallback(async (isRefresh = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    setState(prev => ({
      ...prev,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: null,
      refreshProgress: { current: 0, total: 0 },
      refreshStatus: ''
    }));
    
    try {
      const result = await fetchVideos({
        useCache: useCache && !isRefresh,
        maxChannels,
        includeShorts,
        onProgress: (current, total) => {
          setState(prev => ({ ...prev, refreshProgress: { current, total } }));
        },
        onStatusChange: (status) => {
          setState(prev => ({ ...prev, refreshStatus: status }));
        }
      });
      
      setState(prev => ({
        ...prev,
        videos: result.videos,
        subscriptions: result.subscriptions,
        loading: false,
        refreshing: false,
        lastUpdated: new Date(),
        cacheAge: 0
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        loading: false,
        refreshing: false
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [useCache, maxChannels, includeShorts]);
  
  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);
  
  const startAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      if (!loadingRef.current) {
        loadData(true);
      }
    }, autoRefreshInterval);
  }, [loadData, autoRefreshInterval]);
  
  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);
  
  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Start auto-refresh after initial load
  useEffect(() => {
    if (!state.loading && state.lastUpdated) {
      startAutoRefresh();
    }
    
    return () => stopAutoRefresh();
  }, [state.loading, state.lastUpdated, startAutoRefresh, stopAutoRefresh]);
  
  return {
    ...state,
    refresh,
    startAutoRefresh,
    stopAutoRefresh
  };
}
