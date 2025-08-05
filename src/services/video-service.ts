import { loadSubscriptions } from "../youtube";
import type { VideoItem, Subscription } from "../types";

function generateFallbackThumbnailUrl(videoLink: string): string | undefined {
  // Extract video ID from YouTube URL and generate thumbnail URL
  const videoIdMatch = videoLink.match(/[?&]v=([^&]+)/) || videoLink.match(/\/shorts\/([^?&]+)/);
  if (videoIdMatch) {
    return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
  }
  return undefined;
}

async function initDatabase() {
  const { Database } = await import("bun:sqlite");
  const db = new Database("./cache.db");

  db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        channel TEXT NOT NULL,
        link TEXT NOT NULL,
        published INTEGER NOT NULL,
        is_short BOOLEAN NOT NULL DEFAULT 0,
        thumbnail_url TEXT,
        cached_at INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_published ON videos(published);
      CREATE INDEX IF NOT EXISTS idx_cached_at ON videos(cached_at);
      CREATE INDEX IF NOT EXISTS idx_is_short ON videos(is_short);
    `);

  // Add thumbnail_url column to existing tables (migration)
  try {
    db.run(`ALTER TABLE videos ADD COLUMN thumbnail_url TEXT`);
  } catch (err) {
    // Column already exists, ignore error
  }

  return db;
}

function loadFromCache(
  db: any,
  maxAge: number = 30 * 60 * 1000
): VideoItem[] {
  const cutoff = Date.now() - maxAge;

  const stmt = db.prepare(`
    SELECT * FROM videos 
    WHERE cached_at > ? 
    ORDER BY published ASC
  `);
  const videos = stmt.all(cutoff);

  return videos.map((v: any) => ({
    videoId: v.id,
    title: v.title,
    channel: v.channel,
    link: v.link,
    published: new Date(v.published),
    publishedFormatted: new Date(v.published).toLocaleDateString(),
    publishedDateTime: new Date(v.published).toLocaleString(),
    isShort: Boolean(v.is_short),
    thumbnailUrl: v.thumbnail_url || generateFallbackThumbnailUrl(v.link),
  }));
}

function saveToCache(db: any, videos: VideoItem[]): void {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO videos (id, title, channel, link, published, is_short, thumbnail_url, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();

  db.transaction(() => {
    for (const video of videos) {
      insert.run(
        video.videoId,
        video.title,
        video.channel,
        video.link,
        video.published.getTime(),
        video.isShort ? 1 : 0,
        video.thumbnailUrl || null,
        now
      );
    }
  })();
}

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

  // Filter shorts and ensure valid video items
  allVideos = allVideos.filter((video) => !video.isShort && video && video.title && video.channel && video.link && video.videoId);

  // Sort by published date (newest first - latest videos at top)
  // This matches the sorting in groupVideosByDays to avoid double sorting
  allVideos.sort((a, b) => b.published.getTime() - a.published.getTime());

  db.close();

  return { videos: allVideos, subscriptions: subs };
}