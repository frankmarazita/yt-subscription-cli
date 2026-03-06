import { useMemo } from 'react';
import { useVideosQuery } from './useVideosQuery';
import { useHistoryQuery } from './useHistoryQuery';
import { useWatchLater } from './useWatchLater';
import { useVideoActions } from './useVideoActions';

export function useVideoScreen() {
  const { data: videos, isLoading, error } = useVideosQuery();
  const { data: history } = useHistoryQuery();
  const { data: watchLater } = useWatchLater();
  const { markWatched, markUnwatched, addWatchLater, removeWatchLater } = useVideoActions();

  const watchedIds = useMemo(() => new Set(history?.ids ?? []), [history]);
  const watchLaterIds = useMemo(() => new Set(watchLater?.ids ?? []), [watchLater]);

  function toggleWatched(videoId: string) {
    if (watchedIds.has(videoId)) markUnwatched(videoId);
    else markWatched(videoId);
  }

  function toggleWatchLater(videoId: string) {
    if (watchLaterIds.has(videoId)) removeWatchLater(videoId);
    else addWatchLater(videoId);
  }

  return { videos, isLoading, error, watchedIds, watchLaterIds, toggleWatched, toggleWatchLater };
}
