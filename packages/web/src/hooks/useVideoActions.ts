import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/client';
import { historyQueryKey } from './useHistoryQuery';
import { watchLaterQueryKey } from './useWatchLater';

export function useVideoActions() {
  const queryClient = useQueryClient();

  async function markWatched(videoId: string) {
    await apiClient.history.markWatched({ params: { videoId } });
    queryClient.invalidateQueries({ queryKey: historyQueryKey });
  }

  async function markUnwatched(videoId: string) {
    await apiClient.history.markUnwatched({ params: { videoId } });
    queryClient.invalidateQueries({ queryKey: historyQueryKey });
  }

  async function addWatchLater(videoId: string) {
    await apiClient.watchLater.add({ params: { videoId } });
    queryClient.invalidateQueries({ queryKey: watchLaterQueryKey });
  }

  async function removeWatchLater(videoId: string) {
    await apiClient.watchLater.remove({ params: { videoId } });
    queryClient.invalidateQueries({ queryKey: watchLaterQueryKey });
  }

  return { markWatched, markUnwatched, addWatchLater, removeWatchLater };
}
