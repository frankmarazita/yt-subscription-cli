import type { VideoDto } from "@subs/contracts";
import type { VideoItem } from "../types";

export function getApiBaseUrl(): string {
  try {
    const { loadConfig } = require("../utils/config");
    const config = loadConfig();
    if (config.apiUrl) return config.apiUrl;
  } catch {
    // fall through to default
  }

  return "http://localhost:3000";
}

export function deserializeVideo(v: VideoDto): VideoItem {
  const published = new Date(v.published);
  return {
    videoId: v.videoId,
    title: v.title,
    channel: v.channel,
    link: v.link,
    published,
    publishedFormatted: published.toLocaleDateString(),
    publishedDateTime: published.toLocaleString(),
    isShort: v.isShort,
    thumbnailUrl: v.thumbnailUrl,
    viewCount: v.viewCount,
    likeCount: v.likeCount,
    description: v.description,
  };
}
