import type { VideoDto } from "@subs/contracts";
import type { VideoItem } from "../types";

export function deserializeVideo(v: VideoDto): VideoItem {
  const published = new Date(v.published);
  return {
    videoId: v.videoId,
    title: v.title,
    channel: v.channel,
    link: v.link,
    published,
    publishedFormatted: `${published.toLocaleDateString("en-CA")} ${published.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`,
    isShort: v.isShort,
    thumbnailUrl: v.thumbnailUrl,
  };
}
