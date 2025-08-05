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

  // Memoize stable dimensions with better scaling increments
  const stableDimensions = useMemo(
    () => ({ width, height }),
    [
      Math.floor(width / 5) * 5, // Update when width changes by 5 (more responsive)
      Math.floor(height / 3) * 3, // Update when height changes by 3 (more responsive)
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

        // Scale dimensions based on available space
        const availableWidth = stableDimensions.width - 2; // Less padding
        
        // More aggressive scaling for small screens
        let targetWidth;
        
        if (availableWidth < 30) {
          // Very small - use almost full width
          targetWidth = Math.max(16, availableWidth - 1);
        } else if (availableWidth < 45) {
          // Small - use most of the width
          targetWidth = Math.max(24, availableWidth - 2);
        } else if (availableWidth < 70) {
          // Medium - good size
          targetWidth = Math.max(35, availableWidth - 3);
        } else {
          // Large - cap at reasonable size
          targetWidth = Math.max(50, Math.min(availableWidth - 4, 80));
        }
        
        // Let terminal-image calculate the height automatically
        const targetHeight = undefined;

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
          preserveAspectRatio: true, // Keep aspect ratio, auto-calculate height
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
    <Box width={width} height={height} flexDirection="column" paddingLeft={1}>
      <Box flexGrow={1} justifyContent="flex-start" alignItems="flex-start">
        {loading && <Text color="yellow">Loading thumbnail...</Text>}
        {error && <Text color="red">Failed to load image</Text>}
        {imageData && !loading && !error && (
          <Box flexDirection="column" alignItems="flex-start" width="100%">
            <Text>{imageData}</Text>
            <Text color="cyan" bold>
              {video.title.length > width - 8
                ? `${video.title.substring(0, width - 8)}...`
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
