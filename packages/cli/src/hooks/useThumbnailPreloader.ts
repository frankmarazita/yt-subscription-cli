import { useEffect } from "react";
import type { VideoItem } from "../types";
import { useAppStore } from "../store/appStore";
import {
  buildCacheKey,
  calculateTargetWidth,
  fetchAndRenderThumbnail,
} from "../utils/thumbnailUtils";

export function useThumbnailPreloader(
  videos: (VideoItem | null | undefined)[],
  dimensions: { width: number; height: number },
  delayMs = 100
) {
  const getThumbnailFromCache = useAppStore(
    (state) => state.getThumbnailFromCache
  );
  const setThumbnailCache = useAppStore((state) => state.setThumbnailCache);

  const videoIds = videos
    .filter((v): v is VideoItem => !!v?.thumbnailUrl)
    .map((v) => v.videoId)
    .join(",");

  useEffect(() => {
    const candidates = videos.filter((v): v is VideoItem => !!v?.thumbnailUrl);
    if (candidates.length === 0) return;

    const controller = new AbortController();
    const availableWidth = dimensions.width - 2;
    const targetWidth = calculateTargetWidth(availableWidth);

    const preload = async (v: VideoItem) => {
      const cacheKey = buildCacheKey(
        v.videoId,
        dimensions.width,
        dimensions.height
      );
      if (getThumbnailFromCache(cacheKey)) return;
      const image = await fetchAndRenderThumbnail(
        v.thumbnailUrl!,
        targetWidth,
        controller.signal
      );
      if (image && !controller.signal.aborted) {
        setThumbnailCache(cacheKey, image);
      }
    };

    const timer = setTimeout(() => {
      candidates.forEach((v) => preload(v).catch(() => {}));
    }, delayMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoIds, dimensions.width, dimensions.height]);
}
