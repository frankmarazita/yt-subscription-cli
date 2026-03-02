import { create } from "zustand";
import {
  watchLaterAdd,
  watchLaterRemove,
  markVideoAsWatched,
  markVideoAsUnwatched,
} from "../services/api-client";
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
    try {
      const isAdded = get().isVideoInWatchLater(videoId);
      if (isAdded) {
        await watchLaterRemove(videoId);
      } else {
        await watchLaterAdd(videoId);
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
      set((state) => {
        const newWatchedIds = new Set(state.watchedIds);
        newWatchedIds.add(videoId);
        return { watchedIds: newWatchedIds };
      });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to mark video as watched",
      });
    }
  },

  toggleVideoWatchedStatus: async (videoId: string) => {
    try {
      const isWatched = get().isVideoWatched(videoId);
      if (isWatched) {
        await markVideoAsUnwatched(videoId);
      } else {
        await markVideoAsWatched(videoId);
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
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to toggle watched status",
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
