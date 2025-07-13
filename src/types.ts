export interface VideoItem {
  title: string;
  channel: string;
  link: string;
  published: Date;
  publishedFormatted: string;
  publishedDateTime: string;
  isShort: boolean;
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

export interface AppProps {
  useCache: boolean;
  maxChannels?: number;
  includeShorts: boolean;
}