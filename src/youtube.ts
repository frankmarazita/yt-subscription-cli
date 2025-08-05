import { parseString } from "xml2js";
import { readFile } from "fs/promises";
import type { VideoItem, Subscription } from "./types";

export async function loadSubscriptions(): Promise<Subscription[]> {
  try {
    const data = await readFile("./subscriptions.csv", "utf-8");
    const lines = data.trim().split('\n');
    const subscriptions: Subscription[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [channelId, channelUrl, channelTitle] = line.split(',');
      if (channelId && channelTitle) {
        subscriptions.push({
          snippet: {
            channelId: channelId.trim(),
            title: channelTitle.trim()
          }
        });
      }
    }
    
    return subscriptions;
  } catch (error) {
    throw new Error("Failed to load subscriptions.csv");
  }
}

export async function fetchRSSFeed(
  channelId: string,
  channelName: string
): Promise<VideoItem[]> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const response = await fetch(rssUrl);
    if (!response.ok) {
      return [];
    }

    const xmlData = await response.text();

    return new Promise((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        const videos: VideoItem[] = [];
        const entries = result?.feed?.entry || [];

        for (const entry of entries) {
          const publishedDate = new Date(entry.published[0]);
          const link = entry.link[0].$.href;
          const isShort = link.includes("/shorts/");
          
          // Extract thumbnail URL from media:group > media:thumbnail
          let thumbnailUrl: string | undefined;
          if (entry["media:group"] && entry["media:group"][0]["media:thumbnail"]) {
            const thumbnails = entry["media:group"][0]["media:thumbnail"];
            // Use the highest quality thumbnail (last one in the array)
            thumbnailUrl = thumbnails[thumbnails.length - 1]?.$.url;
          }
          
          // Fallback: generate thumbnail URL from video ID if not found in RSS
          if (!thumbnailUrl) {
            const videoIdMatch = link.match(/[?&]v=([^&]+)/);
            if (videoIdMatch) {
              thumbnailUrl = `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
            }
          }

          videos.push({
            title: entry.title[0],
            channel: entry.author[0].name[0],
            link,
            published: publishedDate,
            publishedFormatted: publishedDate.toLocaleDateString(),
            publishedDateTime: publishedDate.toLocaleString(),
            isShort,
            thumbnailUrl,
          });
        }

        resolve(videos);
      });
    });
  } catch (error) {
    return [];
  }
}

export async function fetchBatch(
  subscriptions: Subscription[],
  batchSize: number = 50
): Promise<VideoItem[]> {
  const allVideos: VideoItem[] = [];

  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize);

    const promises = batch.map((sub) =>
      fetchRSSFeed(sub.snippet.channelId, sub.snippet.title)
    );

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === "fulfilled") {
        allVideos.push(...result.value);
      }
    }

    // Small delay between batches
    if (i + batchSize < subscriptions.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return allVideos;
}
