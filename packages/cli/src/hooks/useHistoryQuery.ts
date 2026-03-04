import { tsrQueryClient } from "../services/client";

export const historyQueryKey = ["history"] as const;

export function useHistoryQuery() {
  return tsrQueryClient.history.getIds.useQuery({
    queryKey: historyQueryKey,
    select: (result) => result.body,
  });
}
