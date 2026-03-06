export interface VideoItem {
  videoId: string;
  title: string;
  channel: string;
  link: string;
  published: Date;
  publishedFormatted: string;
  isShort: boolean;
  thumbnailUrl?: string;
}
