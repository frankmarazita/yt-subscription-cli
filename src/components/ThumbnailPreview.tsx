import { useState, useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import { useAppStore } from "../store/appStore";
import type { VideoItem } from "../types";
import terminalImage from "terminal-image";

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
  const [imageData, setImageData] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Use store for thumbnail cache
  const getThumbnailFromCache = useAppStore(
    (state) => state.getThumbnailFromCache
  );
  const setThumbnailCache = useAppStore((state) => state.setThumbnailCache);

  // Memoize stable dimensions to reduce re-renders
  const stableDimensions = useMemo(
    () => ({ width, height }),
    [
      Math.floor(width / 10) * 10, // Only update when width changes by 10+
      Math.floor(height / 5) * 5, // Only update when height changes by 5+
    ]
  );

  useEffect(() => {
    if (!video?.thumbnailUrl) {
      setImageData("");
      setError("");
      return;
    }

    const loadThumbnailData = async () => {
      setLoading(true);
      setError("");

      // Create cache key using videoId and dimensions
      const cacheKey = `${video.videoId}-${stableDimensions.width}x${stableDimensions.height}`;

      // Check cache first for instant loading
      const cachedImage = getThumbnailFromCache(cacheKey);
      if (cachedImage) {
        setImageData(cachedImage);
        setLoading(false);
        return;
      }

      try {
        // Ensure video.thumbnailUrl is not undefined before fetching
        if (!video.thumbnailUrl) {
          setImageData("");
          setLoading(false);
          return;
        }

        // Calculate target dimensions with constraints like the old implementation
        const targetWidth = Math.min(stableDimensions.width - 4, 60);
        const targetHeight = Math.min(stableDimensions.height - 4, 20);

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
          height: targetHeight,
          preserveAspectRatio: true,
        });

        if (image) {
          setImageData(image);
          // Cache the result
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

  return (
    <Box width={width} height={height} flexDirection="column">
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        {loading && <Text color="yellow">Loading thumbnail...</Text>}
        {error && <Text color="red">Failed to load image</Text>}
        {imageData && !loading && !error && (
          <Box flexDirection="column" alignItems="center">
            <Text>{imageData}</Text>
            <Text color="cyan" bold>
              {video.title.length > 30
                ? `${video.title.substring(0, 30)}...`
                : video.title}
            </Text>
            <Text color="gray" wrap="wrap">
              {video.channel}
            </Text>
          </Box>
        )}
        {!imageData && !loading && !error && video.thumbnailUrl && (
          <Box flexDirection="column" alignItems="center">
            <Text color="gray">📺</Text>
            <Text color="gray" wrap="wrap">
              {video.title.substring(0, 30)}...
            </Text>
            <Text color="cyan" bold>
              {video.channel}
            </Text>
          </Box>
        )}
        {!video.thumbnailUrl && !loading && (
          <Text color="gray">No thumbnail available</Text>
        )}
      </Box>
    </Box>
  );
}
