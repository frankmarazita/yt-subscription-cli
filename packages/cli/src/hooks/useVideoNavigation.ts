import { useState, useEffect, useMemo } from "react";
import type { VideoItem } from "../types";

export function useVideoNavigation(
  videos: VideoItem[],
  listHeight: number,
  resetKey: unknown
) {
  const [{ currentSelection, scrollOffset }, setNavState] = useState({
    currentSelection: 0,
    scrollOffset: 0,
  });

  useEffect(() => {
    setNavState({ currentSelection: 0, scrollOffset: 0 });
  }, [resetKey]);

  const selectedVideo = useMemo(
    () => videos[currentSelection] ?? null,
    [videos, currentSelection]
  );

  const nextVideo = useMemo(
    () => videos[currentSelection + 1] ?? null,
    [videos, currentSelection]
  );

  const prevVideo = useMemo(
    () => videos[currentSelection - 1] ?? null,
    [videos, currentSelection]
  );

  const computeScrollOffset = (selection: number, curScroll: number) => {
    if (selection < curScroll) return selection;
    if (selection >= curScroll + listHeight) return selection - listHeight + 1;
    return curScroll;
  };

  const navigateUp = () => {
    if (videos.length === 0) return;
    setNavState(({ currentSelection: cur, scrollOffset: scroll }) => {
      const next = Math.max(0, cur - 1);
      return { currentSelection: next, scrollOffset: computeScrollOffset(next, scroll) };
    });
  };

  const navigateDown = () => {
    if (videos.length === 0) return;
    setNavState(({ currentSelection: cur, scrollOffset: scroll }) => {
      const next = Math.min(videos.length - 1, cur + 1);
      return { currentSelection: next, scrollOffset: computeScrollOffset(next, scroll) };
    });
  };

  const pageUp = () => {
    if (videos.length === 0) return;
    setNavState(({ currentSelection: cur, scrollOffset: scroll }) => {
      const next = Math.max(0, cur - Math.max(1, listHeight - 1));
      return { currentSelection: next, scrollOffset: computeScrollOffset(next, scroll) };
    });
  };

  const pageDown = () => {
    if (videos.length === 0) return;
    setNavState(({ currentSelection: cur, scrollOffset: scroll }) => {
      const next = Math.min(videos.length - 1, cur + Math.max(1, listHeight - 1));
      return { currentSelection: next, scrollOffset: computeScrollOffset(next, scroll) };
    });
  };

  return {
    currentSelection,
    scrollOffset,
    selectedVideo,
    nextVideo,
    prevVideo,
    navigateUp,
    navigateDown,
    pageUp,
    pageDown,
  };
}
