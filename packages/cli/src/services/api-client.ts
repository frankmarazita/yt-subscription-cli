import type { VideoDto } from "@subs/contracts";
import type { VideoItem } from "../types";
import { useConfigStore } from "../store/configStore";

export function getApiBaseUrl(): string {
  return useConfigStore.getState().getActiveApiUrl();
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
