import { create } from "zustand";
import { apiClient } from "../services/client";
import { useConfigStore } from "./configStore";
import type { VideoItem } from "../types";

interface AppState {
  // Video data
  videos: VideoItem[];
  videosUpdatedAt: number;
  watchLaterIds: Set<string>;
  watchedIds: Set<string>;

  // UI state
  showPreview: boolean;
  showWatchLaterOnly: boolean;

  // Thumbnail cache
  thumbnailCache: Map<string, string>;

  // Mutation error
  error: string | null;

  // Actions
  initializeApp: () => void;
  setVideos: (videos: VideoItem[], updatedAt: number) => void;
  togglePreview: () => void;
  toggleWatchLaterOnly: () => void;
  setThumbnailCache: (videoId: string, thumbnailData: string) => void;
  getThumbnailFromCache: (videoId: string) => string | undefined;
  toggleVideoWatchLater: (videoId: string) => Promise<void>;
  markVideoAsWatched: (videoId: string) => Promise<void>;
  toggleVideoWatchedStatus: (videoId: string) => Promise<void>;
  isVideoInWatchLater: (videoId: string) => boolean;
  isVideoWatched: (videoId: string) => boolean;
}

let initialShowPreview = true;
try {
  const { loadConfig } = require("../utils/config");
  const config = loadConfig();
  initialShowPreview = config.userPreferences.thumbnailPreview;
} catch {
  // Keep default fallback
}

export const useAppStore = create<AppState>((set, get) => ({
  videos: [],
  videosUpdatedAt: 0,
  watchLaterIds: new Set(),
  watchedIds: new Set(),
  error: null,
  showPreview: initialShowPreview,
  showWatchLaterOnly: false,
  thumbnailCache: new Map(),

  initializeApp: () => {
    const configStore = useConfigStore.getState();
    configStore.loadConfig();
    configStore.startWatching();
  },

  setVideos: (videos, updatedAt) => {
    set({ videos, videosUpdatedAt: updatedAt });
  },

  togglePreview: () => {
    set((state) => {
      const newShowPreview = !state.showPreview;
      const configStore = useConfigStore.getState();
      configStore.updateUserPreferences({ thumbnailPreview: newShowPreview });
      return { showPreview: newShowPreview };
    });
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

  toggleVideoWatchLater: async (videoId: string) => {
    const isAdded = get().isVideoInWatchLater(videoId);
    set((state) => {
      const newWatchLaterIds = new Set(state.watchLaterIds);
      if (isAdded) newWatchLaterIds.delete(videoId);
      else newWatchLaterIds.add(videoId);
      return { watchLaterIds: newWatchLaterIds };
    });

    const result = await (isAdded
      ? apiClient.watchLater.remove({ params: { videoId } })
      : apiClient.watchLater.add({ params: { videoId } }));

    if (result.status !== 204) {
      set((state) => {
        const newWatchLaterIds = new Set(state.watchLaterIds);
        if (isAdded) newWatchLaterIds.add(videoId);
        else newWatchLaterIds.delete(videoId);
        return { watchLaterIds: newWatchLaterIds, error: `API error: ${result.status}` };
      });
    }
  },

  markVideoAsWatched: async (videoId: string) => {
    if (get().isVideoWatched(videoId)) return;
    set((state) => {
      const newWatchedIds = new Set(state.watchedIds);
      newWatchedIds.add(videoId);
      return { watchedIds: newWatchedIds };
    });

    const result = await apiClient.history.markWatched({ params: { videoId } });
    if (result.status !== 204) {
      set((state) => {
        const newWatchedIds = new Set(state.watchedIds);
        newWatchedIds.delete(videoId);
        return { watchedIds: newWatchedIds, error: `API error: ${result.status}` };
      });
    }
  },

  toggleVideoWatchedStatus: async (videoId: string) => {
    const isWatched = get().isVideoWatched(videoId);
    set((state) => {
      const newWatchedIds = new Set(state.watchedIds);
      if (isWatched) newWatchedIds.delete(videoId);
      else newWatchedIds.add(videoId);
      return { watchedIds: newWatchedIds };
    });

    const result = await (isWatched
      ? apiClient.history.markUnwatched({ params: { videoId } })
      : apiClient.history.markWatched({ params: { videoId } }));

    if (result.status !== 204) {
      set((state) => {
        const newWatchedIds = new Set(state.watchedIds);
        if (isWatched) newWatchedIds.add(videoId);
        else newWatchedIds.delete(videoId);
        return { watchedIds: newWatchedIds, error: `API error: ${result.status}` };
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
