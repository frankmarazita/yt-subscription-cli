import { create } from "zustand";
import { fetchVideos, toggleWatchLater, markVideoAsWatched, toggleWatchedStatus } from "../services/video-service";
import type { VideoItem, Subscription } from "../types";

interface AppState {
  // Video data
  videos: VideoItem[];
  subscriptions: Subscription[];
  watchLaterIds: Set<string>;
  watchedIds: Set<string>;

  // Loading states
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Progress tracking
  refreshProgress: { current: number; total: number };
  refreshStatus: string;

  // Metadata
  lastUpdated: Date | null;
  cacheAge: number;

  // UI state
  showPreview: boolean;
  showWatchLaterOnly: boolean;

  // Thumbnail cache
  thumbnailCache: Map<string, string>;

  // Actions
  loadVideos: (forceRefresh?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  togglePreview: () => void;
  toggleWatchLaterOnly: () => void;
  setThumbnailCache: (videoId: string, thumbnailData: string) => void;
  getThumbnailFromCache: (videoId: string) => string | undefined;
  clearError: () => void;
  toggleVideoWatchLater: (videoId: string) => Promise<void>;
  markVideoAsWatched: (videoId: string) => Promise<void>;
  toggleVideoWatchedStatus: (videoId: string) => Promise<void>;
  isVideoInWatchLater: (videoId: string) => boolean;
  isVideoWatched: (videoId: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  videos: [],
  subscriptions: [],
  watchLaterIds: new Set(),
  watchedIds: new Set(),
  loading: false,
  refreshing: false,
  error: null,
  refreshProgress: { current: 0, total: 0 },
  refreshStatus: "",
  lastUpdated: null,
  cacheAge: 0,
  showPreview: true,
  showWatchLaterOnly: false,
  thumbnailCache: new Map(),

  // Actions
  loadVideos: async (forceRefresh = false) => {
    const state = get();

    // Prevent concurrent loads
    if (state.loading || state.refreshing) return;

    set({
      loading: !forceRefresh,
      refreshing: forceRefresh,
      error: null,
      refreshProgress: { current: 0, total: 0 },
      refreshStatus: "",
    });

    try {
      const result = await fetchVideos({
        onProgress: (current, total) => {
          set({ refreshProgress: { current, total } });
        },
        onStatusChange: (status) => {
          set({ refreshStatus: status });
        },
        forceRefresh,
      });

      // Replace the entire videos array to ensure clean state
      set({
        videos: [...result.videos], // Create new array reference
        subscriptions: [...result.subscriptions], // Create new array reference
        watchLaterIds: new Set(result.watchLaterIds), // Create new Set reference
        watchedIds: new Set(result.watchedIds), // Create new Set reference
        loading: false,
        refreshing: false,
        lastUpdated: new Date(),
        cacheAge: 0,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unknown error occurred",
        loading: false,
        refreshing: false,
      });
    }
  },

  refresh: async () => {
    await get().loadVideos(true);
  },

  togglePreview: () => {
    set((state) => ({ showPreview: !state.showPreview }));
  },

  toggleWatchLaterOnly: () => {
    set((state) => ({ showWatchLaterOnly: !state.showWatchLaterOnly }));
  },

  setThumbnailCache: (videoId: string, thumbnailData: string) => {
    set((state) => {
      const newCache = new Map(state.thumbnailCache);
      newCache.set(videoId, thumbnailData);
      return { thumbnailCache: newCache };
    });
  },

  getThumbnailFromCache: (videoId: string) => {
    return get().thumbnailCache.get(videoId);
  },

  clearError: () => {
    set({ error: null });
  },

  toggleVideoWatchLater: async (videoId: string) => {
    try {
      const isAdded = await toggleWatchLater(videoId);
      set((state) => {
        const newWatchLaterIds = new Set(state.watchLaterIds);
        if (isAdded) {
          newWatchLaterIds.add(videoId);
        } else {
          newWatchLaterIds.delete(videoId);
        }
        return { watchLaterIds: newWatchLaterIds };
      });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to toggle watch later",
      });
    }
  },

  markVideoAsWatched: async (videoId: string) => {
    try {
      await markVideoAsWatched(videoId);
      // Update local state immediately
      set((state) => {
        const newWatchedIds = new Set(state.watchedIds);
        newWatchedIds.add(videoId);
        return { watchedIds: newWatchedIds };
      });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to mark video as watched",
      });
    }
  },

  toggleVideoWatchedStatus: async (videoId: string) => {
    try {
      const isNowWatched = await toggleWatchedStatus(videoId);
      // Update local state immediately
      set((state) => {
        const newWatchedIds = new Set(state.watchedIds);
        if (isNowWatched) {
          newWatchedIds.add(videoId);
        } else {
          newWatchedIds.delete(videoId);
        }
        return { watchedIds: newWatchedIds };
      });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to toggle watched status",
      });
    }
  },

  isVideoInWatchLater: (videoId: string) => {
    return get().watchLaterIds.has(videoId);
  },

  isVideoWatched: (videoId: string) => {
    return get().watchedIds.has(videoId);
  },
}));
