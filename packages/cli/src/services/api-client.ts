import type { VideoItem } from "../types";

export interface RawVideoDto {
  videoId: string;
  title: string;
  channel: string;
  link: string;
  published: string;
  isShort: boolean;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  description?: string;
}

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

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${path}`, init);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response;
}

export function deserializeVideo(v: RawVideoDto): VideoItem {
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

export async function watchLaterAdd(videoId: string): Promise<void> {
  await apiFetch(`/watch-later/${videoId}`, { method: "PUT" });
}

export async function watchLaterRemove(videoId: string): Promise<void> {
  await apiFetch(`/watch-later/${videoId}`, { method: "DELETE" });
}

export async function markVideoAsWatched(videoId: string): Promise<void> {
  await apiFetch(`/history/${videoId}`, { method: "PUT" });
}

export async function markVideoAsUnwatched(videoId: string): Promise<void> {
  await apiFetch(`/history/${videoId}`, { method: "DELETE" });
}
