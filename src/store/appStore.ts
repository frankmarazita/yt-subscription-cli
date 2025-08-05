import { create } from "zustand";
import { fetchVideos } from "../services/video-service";
import type { VideoItem, Subscription } from "../types";

interface AppState {
  // Video data
  videos: VideoItem[];
  subscriptions: Subscription[];

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

  // Thumbnail cache
  thumbnailCache: Map<string, string>;

  // Actions
  loadVideos: (forceRefresh?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  togglePreview: () => void;
  setThumbnailCache: (videoId: string, thumbnailData: string) => void;
  getThumbnailFromCache: (videoId: string) => string | undefined;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  videos: [],
  subscriptions: [],
  loading: false,
  refreshing: false,
  error: null,
  refreshProgress: { current: 0, total: 0 },
  refreshStatus: "",
  lastUpdated: null,
  cacheAge: 0,
  showPreview: true,
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
}));
