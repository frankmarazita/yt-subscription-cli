import { Box, Text, useStdout, useApp } from "ink";
import { exec } from "child_process";
import { VideoList } from "./VideoList";
import { LoadingScreen } from "./LoadingScreen";
import { useAppStore } from "../store/appStore";
import { useConfigStore } from "../store/configStore";
import type { VideoItem } from "../types";
import { useEffect, useState } from "react";

export function App() {
  const { stdout } = useStdout();
  const { exit } = useApp();

  // Centralized dimension handling with process.stdout listener
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 80,
    height: stdout?.rows || 24,
  });

  useEffect(() => {
    const handleResize = () => {
      const newWidth = process.stdout.columns || 80;
      const newHeight = process.stdout.rows || 24;
      setDimensions({ width: newWidth, height: newHeight });
    };

    // Listen to process.stdout resize events
    process.stdout.on("resize", handleResize);

    return () => {
      process.stdout.off("resize", handleResize);
    };
  }, []);

  const store = useAppStore();
  const {
    videos,
    loading,
    refreshing,
    error,
    lastUpdated,
    cacheAge,
    refresh,
    refreshProgress,
    refreshStatus,
  } = store;

  const configStore = useConfigStore();
  const { config } = configStore;

  const autoRefreshInterval = 5 * 60 * 1000; // 5 minutes

  // Initialize app and config
  useEffect(() => {
    store.initializeApp();
  }, []);

  // Listen for config changes and sync with app store
  useEffect(() => {
    const unsubscribe = useConfigStore.subscribe((state) => {
      // Update app store when config changes from external sources
      const currentAppState = useAppStore.getState();
      if (
        currentAppState.showPreview !==
        state.config.userPreferences.thumbnailPreview
      ) {
        useAppStore.setState({
          showPreview: state.config.userPreferences.thumbnailPreview,
        });
      }
    });

    return unsubscribe;
  }, []);

  // Initial load
  useEffect(() => {
    store.loadVideos();
  }, [store.loadVideos]);

  // Auto-refresh setup
  useEffect(() => {
    if (
      !store.lastUpdated ||
      store.loading ||
      !config.userPreferences.autoRefresh
    )
      return;

    const interval = setInterval(() => {
      if (!store.loading && !store.refreshing) {
        store.refresh();
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [
    store.lastUpdated,
    store.loading,
    store.refresh,
    autoRefreshInterval,
    config.userPreferences.autoRefresh,
  ]);

  const openVideoDirectly = (url: string) => {
    const command =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";
    exec(`${command} "${url}"`);
  };

  const openVideoInHtmlViewer = (url: string) => {
    const command =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";

    // TODO: Use correct configs for local viewer
    const urlWithParam = `http://localhost:4000?url=${encodeURIComponent(url)}`;
    exec(`${command} "${urlWithParam}"`);
  };

  const handleVideoSelect = (video: VideoItem) => {
    openVideoDirectly(video.link);
  };

  const handleVideoSelectInViewer = (video: VideoItem) => {
    openVideoInHtmlViewer(video.link);
  };

  const handleExit = () => {
    // Cleanup watchers
    configStore.stopWatching();
    store.stopDownloadsWatcher();
    exit();
  };

  const handleRefresh = () => {
    refresh();
  };

  const displayVideos = videos;

  if (error) {
    return (
      <Box
        height={dimensions.height}
        justifyContent="center"
        alignItems="center"
      >
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <LoadingScreen
        text={refreshStatus || "Loading your YouTube subscriptions..."}
        progress={refreshProgress}
      />
    );
  }

  return (
    <Box height={dimensions.height}>
      <VideoList
        videos={displayVideos}
        onSelect={handleVideoSelect}
        onSelectInViewer={handleVideoSelectInViewer}
        onExit={handleExit}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
        cacheAge={cacheAge}
        refreshProgress={refreshProgress}
        refreshStatus={refreshStatus}
        terminalWidth={dimensions.width}
        terminalHeight={dimensions.height}
      />
    </Box>
  );
}
