import { useState, useEffect, useMemo } from "react";
import type { VideoItem } from "../types";

export function useVideoNavigation(videos: VideoItem[], listHeight: number, resetKey: unknown) {
  const [currentSelection, setCurrentSelection] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    setCurrentSelection(0);
    setScrollOffset(0);
  }, [resetKey]);

  useEffect(() => {
    if (currentSelection < scrollOffset) {
      setScrollOffset(currentSelection);
    } else if (currentSelection >= scrollOffset + listHeight) {
      setScrollOffset(currentSelection - listHeight + 1);
    }
  }, [currentSelection, listHeight, scrollOffset]);

  const selectedVideo = useMemo(
    () => videos[currentSelection] ?? null,
    [videos, currentSelection]
  );

  const nextVideo = useMemo(
    () => videos[currentSelection + 1] ?? null,
    [videos, currentSelection]
  );

  const navigateUp = () => {
    if (videos.length === 0) return;
    setCurrentSelection((i) => Math.max(0, i - 1));
  };

  const navigateDown = () => {
    if (videos.length === 0) return;
    setCurrentSelection((i) => Math.min(videos.length - 1, i + 1));
  };

  const pageUp = () => {
    if (videos.length === 0) return;
    const pageSize = Math.max(1, listHeight - 1);
    setCurrentSelection((i) => Math.max(0, i - pageSize));
  };

  const pageDown = () => {
    if (videos.length === 0) return;
    const pageSize = Math.max(1, listHeight - 1);
    setCurrentSelection((i) => Math.min(videos.length - 1, i + pageSize));
  };

  return {
    currentSelection,
    scrollOffset,
    selectedVideo,
    nextVideo,
    navigateUp,
    navigateDown,
    pageUp,
    pageDown,
  };
}
