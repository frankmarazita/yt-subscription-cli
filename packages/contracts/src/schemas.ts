import { z } from "zod";

export const VideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  link: z.string(),
  published: z.string(),
  isShort: z.boolean(),
  thumbnailUrl: z.string().optional(),
  viewCount: z.number().optional(),
  likeCount: z.number().optional(),
  description: z.string().optional(),
});

export const SubscriptionSchema = z.object({
  channelId: z.string(),
  title: z.string(),
  channelUrl: z.string().optional(),
});

export const IdsResponseSchema = z.object({
  ids: z.array(z.string()),
});

export type VideoDto = z.infer<typeof VideoSchema>;
export type SubscriptionDto = z.infer<typeof SubscriptionSchema>;
export type IdsResponse = z.infer<typeof IdsResponseSchema>;
