import type { VideoDto } from '@subs/contracts';
import type { VideoItem } from '../types';

export function deserializeVideo(v: VideoDto): VideoItem {
  const published = new Date(v.published);
  return {
    videoId: v.videoId,
    title: v.title,
    channel: v.channel,
    link: v.link,
    published,
    publishedFormatted: published.toLocaleDateString(),
    isShort: v.isShort,
    thumbnailUrl: v.thumbnailUrl,
  };
}
