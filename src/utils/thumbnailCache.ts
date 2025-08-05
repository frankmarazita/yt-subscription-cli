import terminalImage from "terminal-image";
import type { VideoItem } from "../types";

// Session-based thumbnail cache with size limit
const thumbnailCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100; // Increased for prefetching

function addToCache(key: string, value: string) {
  // Remove oldest items if cache is full
  if (thumbnailCache.size >= MAX_CACHE_SIZE) {
    const firstKey = thumbnailCache.keys().next().value;
    if (firstKey) {
      thumbnailCache.delete(firstKey);
    }
  }
  thumbnailCache.set(key, value);
}

function getCacheKey(thumbnailUrl: string, width: number, height: number): string {
  return `${thumbnailUrl}_${width}_${height}`;
}

export async function loadThumbnail(
  video: VideoItem,
  width: number,
  height: number
): Promise<string | null> {
  if (!video.thumbnailUrl) {
    return null;
  }

  const targetWidth = Math.min(width - 4, 60);
  const targetHeight = Math.min(height - 4, 20);
  const cacheKey = getCacheKey(video.thumbnailUrl, targetWidth, targetHeight);

  // Check cache first
  const cachedImage = thumbnailCache.get(cacheKey);
  if (cachedImage) {
    return cachedImage;
  }

  try {
    const response = await fetch(video.thumbnailUrl);
    if (!response.ok) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Process with terminal-image
    const image = await terminalImage.buffer(uint8Array, {
      width: targetWidth,
      height: targetHeight,
      preserveAspectRatio: true,
    });

    // Cache the processed image
    addToCache(cacheKey, image);

    return image;
  } catch (err) {
    return null;
  }
}

export function getCachedThumbnail(
  video: VideoItem,
  width: number,
  height: number
): string | null {
  if (!video.thumbnailUrl) {
    return null;
  }

  const targetWidth = Math.min(width - 4, 60);
  const targetHeight = Math.min(height - 4, 20);
  const cacheKey = getCacheKey(video.thumbnailUrl, targetWidth, targetHeight);

  return thumbnailCache.get(cacheKey) || null;
}

// Prefetch thumbnails in background
export function prefetchThumbnails(
  videos: VideoItem[],
  width: number,
  height: number,
  maxPrefetch: number = 3
): void {
  // Run prefetching in background without blocking
  setTimeout(async () => {
    const prefetchPromises = videos.slice(0, maxPrefetch).map(video => 
      loadThumbnail(video, width, height).catch(() => null)
    );
    
    // Run prefetching in batches to avoid overwhelming the system
    for (let i = 0; i < prefetchPromises.length; i += 2) {
      const batch = prefetchPromises.slice(i, i + 2);
      await Promise.allSettled(batch);
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, 50); // Small delay to not interfere with current rendering
}