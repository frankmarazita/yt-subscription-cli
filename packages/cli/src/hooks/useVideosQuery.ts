import { useQueryClient } from "@tanstack/react-query";
import { tsrQueryClient } from "../services/client";
import { deserializeVideo } from "../services/api-client";

export const videosQueryKey = ["videos"] as const;

export function useVideosQuery(refetchInterval?: number | false) {
  return tsrQueryClient.videos.getVideos.useQuery({
    queryKey: videosQueryKey,
    select: (result) =>
      result.body
        .map(deserializeVideo)
        .filter((v) => v.videoId && v.title && v.channel && v.link)
        .sort((a, b) => b.published.getTime() - a.published.getTime()),
    refetchInterval,
  });
}

export function useRefreshVideosMutation() {
  const queryClient = useQueryClient();
  return tsrQueryClient.videos.refreshVideos.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videosQueryKey });
    },
  });
}
