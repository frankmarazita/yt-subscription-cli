import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiBaseUrl,
  deserializeVideo,
  type RawVideoDto,
} from "../services/api-client";

export const videosQueryKey = ["videos"] as const;

export function useVideosQuery(refetchInterval?: number | false) {
  return useQuery({
    queryKey: videosQueryKey,
    queryFn: async () => {
      const base = getApiBaseUrl();
      const response = await fetch(`${base}/videos`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<RawVideoDto[]>;
    },
    select: (data) =>
      data
        .map(deserializeVideo)
        .filter((v) => v.videoId && v.title && v.channel && v.link)
        .sort((a, b) => b.published.getTime() - a.published.getTime()),
    refetchInterval,
  });
}

export function useRefreshVideosMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const base = getApiBaseUrl();
      const response = await fetch(`${base}/videos/refresh`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videosQueryKey });
    },
  });
}
