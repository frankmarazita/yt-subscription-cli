import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/client';

export const historyQueryKey = ['history'] as const;

export function useHistoryQuery() {
  return useQuery({
    queryKey: historyQueryKey,
    queryFn: async () => {
      const result = await apiClient.history.getIds({});
      return result.body;
    },
  });
}
