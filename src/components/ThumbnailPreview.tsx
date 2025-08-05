import { useState, useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import { loadThumbnail, getCachedThumbnail } from "../utils/thumbnailCache";
import type { VideoItem } from "../types";

interface ThumbnailPreviewProps {
  video: VideoItem | null;
  width: number;
  height: number;
}

export function ThumbnailPreview({ video, width, height }: ThumbnailPreviewProps) {
  const [imageData, setImageData] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Memoize stable dimensions to reduce re-renders
  const stableDimensions = useMemo(() => ({ width, height }), [
    Math.floor(width / 10) * 10, // Only update when width changes by 10+
    Math.floor(height / 5) * 5,  // Only update when height changes by 5+
  ]);

  useEffect(() => {
    if (!video?.thumbnailUrl) {
      setImageData("");
      setError("");
      return;
    }

    const loadThumbnailData = async () => {
      setLoading(true);
      setError("");
      
      // Check cache first for instant loading
      const cachedImage = getCachedThumbnail(video, stableDimensions.width, stableDimensions.height);
      if (cachedImage) {
        setImageData(cachedImage);
        setLoading(false);
        return;
      }
      
      try {
        const image = await loadThumbnail(video, stableDimensions.width, stableDimensions.height);
        if (image) {
          setImageData(image);
        } else {
          setImageData("");
        }
      } catch (err) {
        setError("");
        setImageData("");
      } finally {
        setLoading(false);
      }
    };

    loadThumbnailData();
  }, [video?.thumbnailUrl, stableDimensions.width, stableDimensions.height]);

  if (!video) {
    return (
      <Box
        width={width}
        height={height}
        justifyContent="center"
        alignItems="center"
        borderStyle="single"
        borderColor="gray"
      >
        <Text color="gray">Select a video to preview</Text>
      </Box>
    );
  }

  return (
    <Box
      width={width}
      height={height}
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
    >
      <Box height={1} justifyContent="center">
        <Text color="cyan" bold>
          Preview
        </Text>
      </Box>
      
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        {loading && <Text color="yellow">Loading thumbnail...</Text>}
        {error && <Text color="red">Failed to load image</Text>}
        {imageData && !loading && !error && (
          <Text>{imageData}</Text>
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