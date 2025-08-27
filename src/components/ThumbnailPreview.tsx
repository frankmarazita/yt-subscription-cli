import { useState, useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import { useAppStore } from "../store/appStore";
import type { VideoItem } from "../types";
import terminalImage from "terminal-image";
import { formatNumber, truncateText } from "../utils/formatUtils";

// Helper function for calculating target thumbnail width
const calculateTargetWidth = (availableWidth: number): number => {
  if (availableWidth < 30) {
    return Math.max(16, availableWidth - 1);
  } else if (availableWidth < 45) {
    return Math.max(24, availableWidth - 2);
  } else if (availableWidth < 70) {
    return Math.max(35, availableWidth - 3);
  } else {
    return Math.max(50, Math.min(availableWidth - 4, 80));
  }
};

// Status indicators component
function VideoStatusIndicators({
  video,
  isVideoWatched,
  isVideoInWatchLater,
}: {
  video: VideoItem;
  isVideoWatched: (id: string) => boolean;
  isVideoInWatchLater: (id: string) => boolean;
}) {
  const hasStatus =
    isVideoWatched(video.videoId) || isVideoInWatchLater(video.videoId);

  if (!hasStatus) return null;

  return (
    <Box marginTop={1} width="100%" overflow="hidden">
      <Text>
        {isVideoInWatchLater(video.videoId) && <Text color="yellow">★ </Text>}
        {isVideoWatched(video.videoId) && <Text color="cyan">● </Text>}
        <Text color="gray">
          {isVideoWatched(video.videoId) ? "Watched" : "Watch Later"}
        </Text>
      </Text>
    </Box>
  );
}

// Stats display component
function VideoStats({ video, width }: { video: VideoItem; width: number }) {
  if (video.viewCount == null && video.likeCount == null) return null;

  return (
    <Box marginTop={1} width="100%" overflow="hidden">
      <Text color="gray">
        {video.viewCount != null && `👀 ${formatNumber(video.viewCount)}`}
        {video.viewCount != null && video.likeCount != null && " | "}
        {video.likeCount != null && `❤️ ${formatNumber(video.likeCount)}`}
      </Text>
    </Box>
  );
}

// Custom hook for thumbnail loading
function useThumbnailLoader(
  video: VideoItem | null,
  stableDimensions: { width: number; height: number }
) {
  const [imageData, setImageData] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const getThumbnailFromCache = useAppStore(
    (state) => state.getThumbnailFromCache
  );
  const setThumbnailCache = useAppStore((state) => state.setThumbnailCache);

  useEffect(() => {
    if (!video?.thumbnailUrl) {
      setImageData("");
      setError("");
      return;
    }

    const loadThumbnailData = async () => {
      setLoading(true);
      setError("");

      const cacheKey = `${video.videoId}-${stableDimensions.width}x${stableDimensions.height}`;
      const cachedImage = getThumbnailFromCache(cacheKey);

      if (cachedImage) {
        setImageData(cachedImage);
        setLoading(false);
        return;
      }

      try {
        const availableWidth = stableDimensions.width - 2;
        const targetWidth = calculateTargetWidth(availableWidth);

        if (!video.thumbnailUrl) {
          setError("No thumbnail URL available");
          setImageData("");
          setLoading(false);
          return;
        }

        const response = await fetch(video.thumbnailUrl);
        if (!response.ok) {
          setError(`Failed to fetch thumbnail: ${response.statusText}`);
          setImageData("");
          setLoading(false);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const image = await terminalImage.buffer(uint8Array, {
          width: targetWidth,
          preserveAspectRatio: true,
        });

        if (image) {
          setImageData(image);
          setThumbnailCache(cacheKey, image);
        } else {
          setImageData("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setImageData("");
      } finally {
        setLoading(false);
      }
    };

    loadThumbnailData();
  }, [
    video?.videoId,
    video?.thumbnailUrl,
    stableDimensions.width,
    stableDimensions.height,
    getThumbnailFromCache,
    setThumbnailCache,
  ]);

  return { imageData, loading, error };
}

// Video info component (shared between image and fallback views)
function VideoInfo({
  video,
  width,
  isVideoWatched,
  isVideoInWatchLater,
}: {
  video: VideoItem;
  width: number;
  isVideoWatched: (id: string) => boolean;
  isVideoInWatchLater: (id: string) => boolean;
}) {
  return (
    <>
      <Box width="100%" overflow="hidden">
        <Text color="cyan" bold>
          {truncateText(video.title, width - 4)}
        </Text>
      </Box>
      <Box width="100%" overflow="hidden">
        <Text color="gray">{truncateText(video.channel, width - 4)}</Text>
      </Box>
      <VideoStatusIndicators
        video={video}
        isVideoWatched={isVideoWatched}
        isVideoInWatchLater={isVideoInWatchLater}
      />
      <VideoStats video={video} width={width} />
      {video.description && (
        <Box marginTop={1} width="100%" overflow="hidden">
          <Text color="gray">
            {truncateText(video.description, Math.min(200, (width - 4) * 2))}
          </Text>
        </Box>
      )}
    </>
  );
}

interface ThumbnailPreviewProps {
  video: VideoItem | null;
  width: number;
  height: number;
  preloadVideo?: VideoItem | null;
}

export function ThumbnailPreview({
  video,
  width,
  height,
  preloadVideo,
}: ThumbnailPreviewProps) {
  // Use store for preloading and video status
  const getThumbnailFromCache = useAppStore(
    (state) => state.getThumbnailFromCache
  );
  const setThumbnailCache = useAppStore((state) => state.setThumbnailCache);
  const isVideoInWatchLater = useAppStore((state) => state.isVideoInWatchLater);
  const isVideoWatched = useAppStore((state) => state.isVideoWatched);

  // Memoize stable dimensions with better scaling increments
  const stableDimensions = useMemo(
    () => ({ width, height }),
    [
      Math.floor(width / 5) * 5, // Update when width changes by 5 (more responsive)
      Math.floor(height / 3) * 3, // Update when height changes by 3 (more responsive)
    ]
  );

  const { imageData, loading, error } = useThumbnailLoader(
    video,
    stableDimensions
  );

  // Preload next video thumbnail
  useEffect(() => {
    if (!preloadVideo?.thumbnailUrl) return;

    const preloadThumbnailData = async () => {
      const cacheKey = `${preloadVideo.videoId}-${stableDimensions.width}x${stableDimensions.height}`;

      // Skip if already cached
      if (getThumbnailFromCache(cacheKey)) return;

      try {
        // Calculate target dimensions
        const availableWidth = stableDimensions.width - 2;
        const targetWidth = calculateTargetWidth(availableWidth);

        if (!preloadVideo.thumbnailUrl) return;
        const response = await fetch(preloadVideo.thumbnailUrl);
        if (!response.ok) return;

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const image = await terminalImage.buffer(uint8Array, {
          width: targetWidth,
          preserveAspectRatio: true,
        });

        if (image) {
          // Cache the preloaded image
          setThumbnailCache(cacheKey, image);
        }
      } catch (err) {
        // Silently fail preloading to avoid disrupting main UI
      }
    };

    // Delay preloading slightly to not interfere with main thumbnail
    const timer = setTimeout(preloadThumbnailData, 100);
    return () => clearTimeout(timer);
  }, [
    preloadVideo?.videoId,
    preloadVideo?.thumbnailUrl,
    stableDimensions.width,
    stableDimensions.height,
    getThumbnailFromCache,
    setThumbnailCache,
  ]);

  if (!video) {
    return (
      <Box
        width={width}
        height={height}
        justifyContent="center"
        alignItems="center"
      >
        <Text color="gray">Select a video to preview</Text>
      </Box>
    );
  }

  // Render different states
  const renderContent = () => {
    if (loading) {
      return <Text color="yellow">Loading thumbnail...</Text>;
    }

    if (error) {
      return <Text color="red">Failed to load image</Text>;
    }

    if (!video.thumbnailUrl) {
      return <Text color="gray">No thumbnail available</Text>;
    }

    if (imageData) {
      return (
        <Box flexDirection="column" alignItems="flex-start" width="100%">
          <Text>{imageData}</Text>
          <VideoInfo
            video={video}
            width={width}
            isVideoWatched={isVideoWatched}
            isVideoInWatchLater={isVideoInWatchLater}
          />
        </Box>
      );
    }

    // Fallback view without image
    return (
      <Box flexDirection="column" alignItems="center" width="100%">
        <Text color="gray">📺</Text>
        <VideoInfo
          video={video}
          width={width}
          isVideoWatched={isVideoWatched}
          isVideoInWatchLater={isVideoInWatchLater}
        />
      </Box>
    );
  };

  return (
    <Box
      width={width}
      height={height}
      flexDirection="column"
      paddingX={1}
      overflow="hidden"
    >
      <Box flexGrow={1} justifyContent="flex-start" alignItems="flex-start">
        {renderContent()}
      </Box>
    </Box>
  );
}
