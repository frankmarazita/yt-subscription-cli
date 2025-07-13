import type { VideoItem } from "./types";

export async function initDatabase() {
  const BetterSqlite3 = (await import("better-sqlite3")).default;
  const db = new BetterSqlite3("./cache.db");

  db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        channel TEXT NOT NULL,
        link TEXT NOT NULL,
        published INTEGER NOT NULL,
        is_short BOOLEAN NOT NULL DEFAULT 0,
        cached_at INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_published ON videos(published);
      CREATE INDEX IF NOT EXISTS idx_cached_at ON videos(cached_at);
      CREATE INDEX IF NOT EXISTS idx_is_short ON videos(is_short);
    `);

  return db;
}

export function loadFromCache(
  db: any,
  maxAge: number = 30 * 60 * 1000
): VideoItem[] {
  const cutoff = Date.now() - maxAge;

  const videos = db
    .prepare(
      `
    SELECT * FROM videos 
    WHERE cached_at > ? 
    ORDER BY published ASC
  `
    )
    .all(cutoff);

  return videos.map((v: any) => ({
    title: v.title,
    channel: v.channel,
    link: v.link,
    published: new Date(v.published),
    publishedFormatted: new Date(v.published).toLocaleDateString(),
    publishedDateTime: new Date(v.published).toLocaleString(),
    isShort: Boolean(v.is_short),
  }));
}

export function saveToCache(db: any, videos: VideoItem[]): void {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO videos (id, title, channel, link, published, is_short, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();

  const transaction = db.transaction((videos: VideoItem[]) => {
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
        now
      );
    }
  });

  transaction(videos);
}
