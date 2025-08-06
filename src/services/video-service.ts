import { loadSubscriptions } from "../youtube";
import type { VideoItem, Subscription } from "../types";

function generateFallbackThumbnailUrl(videoLink: string): string | undefined {
  // Extract video ID from YouTube URL and generate thumbnail URL
  const videoIdMatch =
    videoLink.match(/[?&]v=([^&]+)/) || videoLink.match(/\/shorts\/([^?&]+)/);
  if (videoIdMatch) {
    return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
  }
  return undefined;
}

async function initDatabase() {
  const { Database } = await import("bun:sqlite");
  const { getDatabasePath } = await import("../utils/config");

  // Use config directory for database
  const dbPath = getDatabasePath();
  const db = new Database(dbPath);

  db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        channel TEXT NOT NULL,
        link TEXT NOT NULL,
        published INTEGER NOT NULL,
        is_short BOOLEAN NOT NULL DEFAULT 0,
        thumbnail_url TEXT,
        view_count INTEGER,
        like_count INTEGER,
        description TEXT,
        cached_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS playlist_videos (
        playlist_id TEXT NOT NULL,
        video_id TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        order_index INTEGER,
        PRIMARY KEY (playlist_id, video_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id),
        FOREIGN KEY (video_id) REFERENCES videos(id)
      );
      
      CREATE TABLE IF NOT EXISTS watch_history (
        video_id TEXT NOT NULL,
        watched_at INTEGER NOT NULL,
        PRIMARY KEY (video_id),
        FOREIGN KEY (video_id) REFERENCES videos(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_published ON videos(published);
      CREATE INDEX IF NOT EXISTS idx_cached_at ON videos(cached_at);
      CREATE INDEX IF NOT EXISTS idx_is_short ON videos(is_short);
      CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist ON playlist_videos(playlist_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_videos_video ON playlist_videos(video_id);
      CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON watch_history(watched_at);
    `);

  // Add new columns to existing tables (migration)
  try {
    db.run(`ALTER TABLE videos ADD COLUMN thumbnail_url TEXT`);
  } catch (err) {
    // Column already exists, ignore error
  }

  try {
    db.run(`ALTER TABLE videos ADD COLUMN view_count INTEGER`);
  } catch (err) {
    // Column already exists, ignore error
  }

  try {
    db.run(`ALTER TABLE videos ADD COLUMN like_count INTEGER`);
  } catch (err) {
    // Column already exists, ignore error
  }

  try {
    db.run(`ALTER TABLE videos ADD COLUMN description TEXT`);
  } catch (err) {
    // Column already exists, ignore error
  }

  // Initialize watch later playlist
  const now = Date.now();
  db.run(
    `
    INSERT OR IGNORE INTO playlists (id, name, created_at, updated_at)
    VALUES ('watch_later', 'Watch Later', ?, ?)
  `,
    [now, now]
  );

  return db;
}

function loadFromCache(db: any, maxAge: number = 30 * 60 * 1000): VideoItem[] {
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
    viewCount: v.view_count || undefined,
    likeCount: v.like_count || undefined,
    description: v.description || undefined,
  }));
}

function saveToCache(db: any, videos: VideoItem[]): void {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO videos (id, title, channel, link, published, is_short, thumbnail_url, view_count, like_count, description, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        video.viewCount || null,
        video.likeCount || null,
        video.description || null,
        now
      );
    }
  })();
}

function loadWatchLaterPlaylist(db: any): Set<string> {
  const stmt = db.prepare(`
    SELECT video_id FROM playlist_videos 
    WHERE playlist_id = 'watch_later'
  `);
  const rows = stmt.all();
  return new Set(rows.map((row: any) => row.video_id));
}

function loadWatchHistory(db: any): Set<string> {
  const stmt = db.prepare(`
    SELECT video_id FROM watch_history
  `);
  const rows = stmt.all();
  return new Set(rows.map((row: any) => row.video_id));
}

export async function toggleWatchLater(videoId: string): Promise<boolean> {
  const db = await initDatabase();

  const checkStmt = db.prepare(`
    SELECT 1 FROM playlist_videos 
    WHERE playlist_id = 'watch_later' AND video_id = ?
  `);
  const exists = checkStmt.get(videoId);

  if (exists) {
    // Remove from watch later
    const deleteStmt = db.prepare(`
      DELETE FROM playlist_videos 
      WHERE playlist_id = 'watch_later' AND video_id = ?
    `);
    deleteStmt.run(videoId);
    db.close();
    return false;
  } else {
    // Add to watch later
    const insertStmt = db.prepare(`
      INSERT INTO playlist_videos (playlist_id, video_id, added_at, order_index)
      VALUES ('watch_later', ?, ?, NULL)
    `);
    insertStmt.run(videoId, Date.now());
    db.close();
    return true;
  }
}

export interface VideoServiceOptions {
  onProgress?: (current: number, total: number) => void;
  onStatusChange?: (status: string) => void;
  forceRefresh?: boolean;
}

export interface VideoServiceResult {
  videos: VideoItem[];
  subscriptions: Subscription[];
  watchLaterIds: Set<string>;
  watchedIds: Set<string>;
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
  allVideos = allVideos.filter(
    (video) =>
      !video.isShort &&
      video &&
      video.title &&
      video.channel &&
      video.link &&
      video.videoId
  );

  // Sort by published date (newest first - latest videos at top)
  // This matches the sorting in groupVideosByDays to avoid double sorting
  allVideos.sort((a, b) => b.published.getTime() - a.published.getTime());

  // Load watch later playlist and watch history
  const watchLaterIds = loadWatchLaterPlaylist(db);
  const watchedIds = loadWatchHistory(db);

  db.close();

  return { videos: allVideos, subscriptions: subs, watchLaterIds, watchedIds };
}

export async function markVideoAsWatched(videoId: string): Promise<void> {
  const db = await initDatabase();

  try {
    // Insert or replace the watch history record
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO watch_history (video_id, watched_at) 
      VALUES (?, ?)
    `);

    stmt.run(videoId, Date.now());
  } finally {
    db.close();
  }
}

export async function markVideoAsUnwatched(videoId: string): Promise<void> {
  const db = await initDatabase();

  try {
    // Remove the video from watch history
    const stmt = db.prepare(`
      DELETE FROM watch_history WHERE video_id = ?
    `);

    stmt.run(videoId);
  } finally {
    db.close();
  }
}

export async function toggleWatchedStatus(videoId: string): Promise<boolean> {
  const db = await initDatabase();

  try {
    // Check if video is currently watched
    const checkStmt = db.prepare(`
      SELECT video_id FROM watch_history WHERE video_id = ?
    `);

    const existing = checkStmt.get(videoId);

    if (existing) {
      // Video is watched, mark as unwatched
      const deleteStmt = db.prepare(`
        DELETE FROM watch_history WHERE video_id = ?
      `);
      deleteStmt.run(videoId);
      return false; // Now unwatched
    } else {
      // Video is unwatched, mark as watched
      const insertStmt = db.prepare(`
        INSERT INTO watch_history (video_id, watched_at) VALUES (?, ?)
      `);
      insertStmt.run(videoId, Date.now());
      return true; // Now watched
    }
  } finally {
    db.close();
  }
}
