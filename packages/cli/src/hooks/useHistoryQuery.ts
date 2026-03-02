import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "../services/api-client";

export const historyQueryKey = ["history"] as const;

export function useHistoryQuery() {
  return useQuery({
    queryKey: historyQueryKey,
    queryFn: async () => {
      const base = getApiBaseUrl();
      const response = await fetch(`${base}/history`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<{ ids: string[] }>;
    },
  });
}
