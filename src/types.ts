export interface VideoItem {
  videoId: string;
  title: string;
  channel: string;
  link: string;
  published: Date;
  publishedFormatted: string;
  publishedDateTime: string;
  isShort: boolean;
  thumbnailUrl?: string;
}



export interface Subscription {
  snippet: {
    channelId: string;
    title: string;
  };
}


