import { create } from "zustand";
import { apiClient } from "../services/client";
import { useConfigStore } from "./configStore";
import { queryClient } from "../queryClient";

interface AppState {
  // Video data
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
    const result = isAdded
      ? await apiClient.watchLater.remove({ params: { videoId } })
      : await apiClient.watchLater.add({ params: { videoId } });

    if (result.status !== 204) {
      set({ error: `API error: ${result.status}` });
      return;
    }

    set((state) => {
      const newWatchLaterIds = new Set(state.watchLaterIds);
      if (isAdded) {
        newWatchLaterIds.delete(videoId);
      } else {
        newWatchLaterIds.add(videoId);
      }
      return { watchLaterIds: newWatchLaterIds };
    });
    queryClient.invalidateQueries({ queryKey: ["watchLater"] });
  },

  markVideoAsWatched: async (videoId: string) => {
    const result = await apiClient.history.markWatched({ params: { videoId } });

    if (result.status !== 204) {
      set({ error: `API error: ${result.status}` });
      return;
    }

    set((state) => {
      const newWatchedIds = new Set(state.watchedIds);
      newWatchedIds.add(videoId);
      return { watchedIds: newWatchedIds };
    });
    queryClient.invalidateQueries({ queryKey: ["history"] });
  },

  toggleVideoWatchedStatus: async (videoId: string) => {
    const isWatched = get().isVideoWatched(videoId);
    const result = isWatched
      ? await apiClient.history.markUnwatched({ params: { videoId } })
      : await apiClient.history.markWatched({ params: { videoId } });

    if (result.status !== 204) {
      set({ error: `API error: ${result.status}` });
      return;
    }

    set((state) => {
      const newWatchedIds = new Set(state.watchedIds);
      if (isWatched) {
        newWatchedIds.delete(videoId);
      } else {
        newWatchedIds.add(videoId);
      }
      return { watchedIds: newWatchedIds };
    });
    queryClient.invalidateQueries({ queryKey: ["history"] });
  },

  isVideoInWatchLater: (videoId: string) => {
    return get().watchLaterIds.has(videoId);
  },

  isVideoWatched: (videoId: string) => {
    return get().watchedIds.has(videoId);
  },
}));
