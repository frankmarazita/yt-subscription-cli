import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/client';

export const watchLaterQueryKey = ['watchLater'] as const;

export function useWatchLater() {
  return useQuery({
    queryKey: watchLaterQueryKey,
    queryFn: async () => {
      const result = await apiClient.watchLater.getIds({});
      return result.body;
    },
  });
}
