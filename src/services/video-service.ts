import { initDatabase, loadFromCache, saveToCache } from "../database-adapter";
import { loadSubscriptions } from "../youtube";
import type { VideoItem, Subscription } from "../types";

export interface VideoServiceOptions {
  onProgress?: (current: number, total: number) => void;
  onStatusChange?: (status: string) => void;
  forceRefresh?: boolean;
}

export interface VideoServiceResult {
  videos: VideoItem[];
  subscriptions: Subscription[];
}

export async function fetchVideos(
  options: VideoServiceOptions
): Promise<VideoServiceResult> {
  const { onProgress, onStatusChange, forceRefresh = false } = options;

  onStatusChange?.("Loading subscriptions...");
  let subs = await loadSubscriptions();

  let allVideos: VideoItem[] = [];
  const db = await initDatabase();

  if (!forceRefresh) {
    onStatusChange?.("Checking cache...");
    allVideos = loadFromCache(db);
  }

  if (allVideos.length === 0 || forceRefresh) {
    if (forceRefresh) {
      allVideos = []; // Clear existing videos when force refreshing
    }
    
    onStatusChange?.("Fetching videos from RSS feeds...");
    onProgress?.(0, subs.length);

    // Fetch in batches and update progress
    const batchSize = 50;
    for (let i = 0; i < subs.length; i += batchSize) {
      const batch = subs.slice(i, i + batchSize);
      onProgress?.(i, subs.length);

      const promises = batch.map((sub) =>
        import("../youtube.js").then(({ fetchRSSFeed }) =>
          fetchRSSFeed(sub.snippet.channelId, sub.snippet.title)
        )
      );

      const results = await Promise.allSettled(promises);

      for (const result of results) {
        if (result.status === "fulfilled") {
          allVideos.push(...result.value);
        }
      }

      // Small delay between batches
      if (i + batchSize < subs.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    onProgress?.(subs.length, subs.length);

    onStatusChange?.("Saving to cache...");
    saveToCache(db, allVideos);
  }

  // Filter shorts
  allVideos = allVideos.filter((video) => !video.isShort);

  // Sort by published date (oldest first - latest videos at bottom)
  allVideos.sort((a, b) => a.published.getTime() - b.published.getTime());

  db.close();

  return { videos: allVideos, subscriptions: subs };
}
