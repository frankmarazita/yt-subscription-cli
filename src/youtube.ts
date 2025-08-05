import { parseString } from "xml2js";
import { readFile } from "fs/promises";
import type { VideoItem, Subscription } from "./types";
import { promisify } from "util";

const parseStringPromise = promisify(parseString);

export async function loadSubscriptions(): Promise<Subscription[]> {
  try {
    const data = await readFile("./subscriptions.csv", "utf-8");
    const lines = data.trim().split("\n");
    const subscriptions: Subscription[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length >= 3) {
        const channelId = parts[0]?.trim();
        const channelTitle = parts[2]?.trim();

        if (channelId && channelTitle) {
          subscriptions.push({
            snippet: {
              channelId: channelId,
              title: channelTitle,
            },
          });
        }
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

    const result: any = await parseStringPromise(xmlData);

    const videos: VideoItem[] = [];
    const entries = result?.feed?.entry || [];

    for (const entry of entries) {
      const publishedDate = new Date(entry.published[0]);
      const link = entry.link[0].$.href;
      const isShort = link.includes("/shorts/");

      const videoId = entry["yt:videoId"]?.[0];

      // Skip if the video ID is missing for any reason
      if (!videoId) {
        continue;
      }

      // Extract thumbnail URL from media:group > media:thumbnail
      let thumbnailUrl: string | undefined;
      if (entry["media:group"] && entry["media:group"][0]["media:thumbnail"]) {
        const thumbnails = entry["media:group"][0]["media:thumbnail"];
        // Use the highest quality thumbnail (last one in the array)
        thumbnailUrl = thumbnails[thumbnails.length - 1]?.$.url;
      }

      // Fallback: generate thumbnail URL from video ID if not found in RSS
      if (!thumbnailUrl) {
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
      }

      videos.push({
        videoId,
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

    return videos;
  } catch (error) {
    return [];
  }
}
