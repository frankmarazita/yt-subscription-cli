import { tsrQueryClient } from "../services/client";

export const watchLaterQueryKey = ["watchLater"] as const;

export function useWatchLater() {
  return tsrQueryClient.watchLater.getIds.useQuery({
    queryKey: watchLaterQueryKey,
    select: (result) => result.body,
  });
}
