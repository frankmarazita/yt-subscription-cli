import { useState, useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import { useAppStore } from "../store/appStore";
import type { VideoItem } from "../types";
import { formatNumber, truncateText } from "../utils/formatUtils";
import {
  buildCacheKey,
  calculateTargetWidth,
  fetchAndRenderThumbnail,
} from "../utils/thumbnailUtils";

// Status indicators component
function VideoStatusIndicators({
  isWatched,
  isInWatchLater,
}: {
  isWatched: boolean;
  isInWatchLater: boolean;
}) {
  if (!isWatched && !isInWatchLater) return null;

  return (
    <Box marginTop={1} width="100%" overflow="hidden">
      <Text>
        {isInWatchLater && <Text color="yellow">★ </Text>}
        {isWatched && <Text color="cyan">● </Text>}
        <Text color="gray">{isWatched ? "Watched" : "Watch Later"}</Text>
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

const THUMBNAIL_DEBOUNCE_MS = 150;

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

    const cacheKey = buildCacheKey(
      video.videoId,
      stableDimensions.width,
      stableDimensions.height
    );
    const cachedImage = getThumbnailFromCache(cacheKey);
    if (cachedImage) {
      setImageData(cachedImage);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadThumbnailData = async () => {
      setLoading(true);
      setError("");

      try {
        const availableWidth = stableDimensions.width - 2;
        const targetWidth = calculateTargetWidth(availableWidth);

        const image = await fetchAndRenderThumbnail(
          video.thumbnailUrl!,
          targetWidth,
          controller.signal
        );
        if (controller.signal.aborted) return;

        if (image) {
          setImageData(image);
          setThumbnailCache(cacheKey, image);
        } else {
          setImageData("");
          setError("Failed to load thumbnail");
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setImageData("");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const timer = setTimeout(loadThumbnailData, THUMBNAIL_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
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
  isWatched,
  isInWatchLater,
}: {
  video: VideoItem;
  width: number;
  isWatched: boolean;
  isInWatchLater: boolean;
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
        isWatched={isWatched}
        isInWatchLater={isInWatchLater}
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
}

export function ThumbnailPreview({
  video,
  width,
  height,
}: ThumbnailPreviewProps) {
  const isInWatchLater = useAppStore((state) =>
    video ? state.watchLaterIds.has(video.videoId) : false
  );
  const isWatched = useAppStore((state) =>
    video ? state.watchedIds.has(video.videoId) : false
  );

  const stableDimensions = useMemo(() => ({ width, height }), [width, height]);

  const { imageData, loading, error } = useThumbnailLoader(
    video,
    stableDimensions
  );

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
            isWatched={isWatched}
            isInWatchLater={isInWatchLater}
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
          isWatched={isWatched}
          isInWatchLater={isInWatchLater}
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
