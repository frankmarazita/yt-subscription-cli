import { create } from "zustand";
import chokidar, { type FSWatcher } from "chokidar";
import type { AppConfig } from "../utils/config";
import {
  DEFAULT_CONFIG,
  getConfigPath,
  loadConfig,
  saveConfig,
} from "../utils/config";

interface ConfigState {
  config: AppConfig;
  isWatching: boolean;
  watcher: FSWatcher | null;

  // Actions
  loadConfig: () => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
  updateUserPreferences: (
    preferences: Partial<AppConfig["userPreferences"]>
  ) => void;
  startWatching: () => void;
  stopWatching: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isWatching: false,
  watcher: null,

  loadConfig: () => {
    const config = loadConfig();
    set({ config });
  },

  updateConfig: (updates: Partial<AppConfig>) => {
    const currentConfig = get().config;
    const newConfig = {
      ...currentConfig,
      ...updates,
      userPreferences: {
        ...currentConfig.userPreferences,
        ...updates.userPreferences,
      },
    };

    set({ config: newConfig });

    // Save to file (this will trigger the watcher, but we handle that)
    saveConfig(newConfig);
  },

  updateUserPreferences: (
    preferences: Partial<AppConfig["userPreferences"]>
  ) => {
    const currentConfig = get().config;
    const newConfig = {
      ...currentConfig,
      userPreferences: {
        ...currentConfig.userPreferences,
        ...preferences,
      },
    };

    set({ config: newConfig });
    saveConfig(newConfig);
  },

  startWatching: () => {
    const { watcher, isWatching } = get();

    if (isWatching || watcher) {
      return; // Already watching
    }

    const configPath = getConfigPath();
    const newWatcher = chokidar.watch(configPath, {
      persistent: true,
      ignoreInitial: true,
    });

    newWatcher.on("change", () => {
      // Small delay to avoid rapid fire changes
      setTimeout(() => {
        try {
          const config = loadConfig();
          set({ config });
        } catch (err) {
          console.warn("Failed to reload config from file:", err);
        }
      }, 50);
    });

    newWatcher.on("error", (error) => {
      console.error("Config file watcher error:", error);
    });

    set({ watcher: newWatcher, isWatching: true });
  },

  stopWatching: () => {
    const { watcher } = get();

    if (watcher) {
      watcher.close();
      set({ watcher: null, isWatching: false });
    }
  },
}));
