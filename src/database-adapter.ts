import type { VideoItem } from "./types";

function generateFallbackThumbnailUrl(videoLink: string): string | undefined {
  // Extract video ID from YouTube URL and generate thumbnail URL
  const videoIdMatch = videoLink.match(/[?&]v=([^&]+)/) || videoLink.match(/\/shorts\/([^?&]+)/);
  if (videoIdMatch) {
    return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
  }
  return undefined;
}

export async function initDatabase() {
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

export function loadFromCache(
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

export function saveToCache(db: any, videos: VideoItem[]): void {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO videos (id, title, channel, link, published, is_short, thumbnail_url, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();

  db.transaction(() => {
    for (const video of videos) {
      const id =
        video.link.split("watch?v=")[1] ||
        video.link.split("/shorts/")[1] ||
        video.link;
      insert.run(
        id,
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
