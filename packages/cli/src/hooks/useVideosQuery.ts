import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/client";
import { deserializeVideo } from "../services/api-client";

export const videosQueryKey = ["videos"] as const;

export function useVideosQuery(refetchInterval?: number | false) {
  return useQuery({
    queryKey: videosQueryKey,
    queryFn: async () => {
      const result = await apiClient.videos.getVideos({});
      if (result.status !== 200)
        throw new Error(`Failed to fetch videos: ${result.status}`);
      if (!Array.isArray(result.body))
        throw new Error(`API returned unexpected response — check your configured API URL`);
      return result.body
        .map(deserializeVideo)
        .filter((v) => v.videoId && v.title && v.channel && v.link)
        .sort((a, b) => b.published.getTime() - a.published.getTime());
    },
    refetchInterval,
  });
}

export const refreshVideosMutationKey = ["refreshVideos"] as const;

export function useRefreshVideosMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: refreshVideosMutationKey,
    mutationFn: () => apiClient.videos.refreshVideos({ query: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videosQueryKey });
    },
  });
}
