import { Box, Text, useStdout } from "ink";
import { exec } from "child_process";
import { VideoList } from "./VideoList";
import { SimpleVideoList } from "./SimpleVideoList";
import { LoadingScreen } from "./LoadingScreen";
import { useVideoData } from "../hooks/useVideoData";
import type { VideoItem } from "../types";

export function App() {
  const { stdout } = useStdout();

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
  } = useVideoData({
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  const openVideoInBrowser = (url: string) => {
    const command =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";
    exec(`${command} "${url}"`);
  };

  const handleVideoSelect = (video: VideoItem) => {
    openVideoInBrowser(video.link);
  };

  const handleExit = () => {
    process.exit(0);
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const hasRawMode =
    process.stdin.isTTY && typeof process.stdin.setRawMode === "function";

  const displayVideos = videos;

  if (error) {
    return (
      <Box
        height={stdout?.rows || 24}
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
    <Box height={stdout?.rows || 24}>
      {hasRawMode ? (
        <VideoList
          videos={displayVideos}
          onSelect={handleVideoSelect}
          onExit={handleExit}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          cacheAge={cacheAge}
          refreshProgress={refreshProgress}
          refreshStatus={refreshStatus}
        />
      ) : (
        <SimpleVideoList
          videos={displayVideos}
          onSelect={handleVideoSelect}
          onExit={handleExit}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          cacheAge={cacheAge}
        />
      )}
    </Box>
  );
}
