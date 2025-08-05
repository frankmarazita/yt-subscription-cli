export interface VideoItem {
  title: string;
  channel: string;
  link: string;
  published: Date;
  publishedFormatted: string;
  publishedDateTime: string;
  isShort: boolean;
  thumbnailUrl?: string;
}

export interface VideoGroup {
  label: string;
  videos: VideoItem[];
  daysBetween: number;
}

export interface Subscription {
  snippet: {
    channelId: string;
    title: string;
  };
}


