import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/client';
import { deserializeVideo } from '../services/api-client';

export const videosQueryKey = ['videos'] as const;

export function useVideosQuery() {
  return useQuery({
    queryKey: videosQueryKey,
    queryFn: async () => {
      const result = await apiClient.videos.getVideos({});
      return result.body
        .map(deserializeVideo)
        .filter((v) => v.videoId && v.title && v.channel && v.link)
        .sort((a, b) => b.published.getTime() - a.published.getTime());
    },
  });
}
