import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../services/client";

export const watchLaterQueryKey = ["watchLater"] as const;

export function useWatchLater() {
  return useQuery({
    queryKey: watchLaterQueryKey,
    queryFn: async () => {
      const result = await apiClient.watchLater.getIds({});
      if (result.status !== 200)
        throw new Error(`Failed to fetch watch later: ${result.status}`);
      return result.body;
    },
  });
}
