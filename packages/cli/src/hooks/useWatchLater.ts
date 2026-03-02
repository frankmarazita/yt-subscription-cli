import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "../services/api-client";

export const watchLaterQueryKey = ["watchLater"] as const;

export function useWatchLater() {
  return useQuery({
    queryKey: watchLaterQueryKey,
    queryFn: async () => {
      const base = getApiBaseUrl();
      const response = await fetch(`${base}/watch-later`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<{ ids: string[] }>;
    },
  });
}
