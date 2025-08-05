import { useState, useMemo, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import Spinner from "ink-spinner";
import {
  groupVideosByDays,
  formatTimeAgo,
  getChannelColor,
} from "../utils/dateUtils";
import { ThumbnailPreview } from "./ThumbnailPreview";
import { prefetchThumbnails } from "../utils/thumbnailCache";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { VideoListItems } from "./VideoListItems";
import type { VideoItem, VideoGroup } from "../types";

interface VideoListProps {
  videos: VideoItem[];
  onSelect: (video: VideoItem) => void;
  onExit: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: Date | null;
  cacheAge?: number;
  refreshProgress?: { current: number; total: number };
  refreshStatus?: string;
}

function isVideoGroup(item: VideoItem | VideoGroup): item is VideoGroup {
  return (item as VideoGroup).videos !== undefined;
}

export function VideoList({
  videos,
  onSelect,
  onExit,
  onRefresh,
  refreshing = false,
  lastUpdated,
  cacheAge = 0,
  refreshProgress = { current: 0, total: 0 },
  refreshStatus = "",
}: VideoListProps) {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  
  // Memoize layout calculations to prevent flickering
  const layout = useMemo(() => {
    const thumbnailWidth = showPreview ? Math.min(80, Math.floor(terminalWidth * 0.5)) : 0;
    const listWidth = terminalWidth - thumbnailWidth;
    const listHeight = Math.max(10, terminalHeight - 8);
    return { thumbnailWidth, listWidth, listHeight };
  }, [terminalWidth, terminalHeight, showPreview]);

  const { thumbnailWidth, listWidth, listHeight } = layout;

  // Memoize column widths to prevent recalculation on every render
  const columnWidths = useMemo(() => {
    const contentWidth = listWidth - 2; // Account for padding
    return {
      channelWidth: Math.floor(contentWidth * 0.2),
      titleWidth: Math.floor(contentWidth * 0.65),
      dateWidth: Math.floor(contentWidth * 0.15),
    };
  }, [listWidth]);

  const videoGroups = useMemo(() => groupVideosByDays(videos), [videos]);

  const flatList = useMemo(() => {
    const items: (VideoGroup | VideoItem)[] = [];
    videoGroups.forEach((group) => {
      items.push(group);
      items.push(...group.videos);
    });
    return items;
  }, [videoGroups]);

  useEffect(() => {
    const firstVideoIndex = flatList.findIndex((item) => !isVideoGroup(item));
    setSelectedIndex(firstVideoIndex !== -1 ? firstVideoIndex : 0);
    setScrollOffset(0);
    
    // Initial prefetching of first few videos
    if (showPreview && flatList.length > 0) {
      const initialVideos: VideoItem[] = [];
      let count = 0;
      const maxInitialPrefetch = 5;
      
      for (let i = 0; i < flatList.length && count < maxInitialPrefetch; i++) {
        const item = flatList[i];
        if (item && !isVideoGroup(item)) {
          initialVideos.push(item as VideoItem);
          count++;
        }
      }
      
      if (initialVideos.length > 0) {
        prefetchThumbnails(initialVideos, thumbnailWidth, listHeight, maxInitialPrefetch);
      }
    }
  }, [videos, flatList, showPreview]); // Remove layout dependencies to reduce re-runs

  const selectedItem = flatList[selectedIndex];
  const selectedVideo = selectedItem && !isVideoGroup(selectedItem) ? selectedItem as VideoItem : null;

  // Prefetch thumbnails for upcoming videos when selection changes
  useEffect(() => {
    if (showPreview && selectedIndex >= 0 && flatList.length > 0) {
      // Get next few videos (skip groups) for prefetching
      const upcomingVideos: VideoItem[] = [];
      let count = 0;
      const maxPrefetch = 3;
      
      for (let i = selectedIndex + 1; i < flatList.length && count < maxPrefetch; i++) {
        const item = flatList[i];
        if (item && !isVideoGroup(item)) {
          upcomingVideos.push(item as VideoItem);
          count++;
        }
      }
      
      if (upcomingVideos.length > 0) {
        prefetchThumbnails(upcomingVideos, thumbnailWidth, listHeight, maxPrefetch);
      }
    }
  }, [selectedIndex, flatList, showPreview]); // Remove layout dependencies to reduce re-runs

  useInput((input, key) => {
    let newIndex = selectedIndex;
    
    if (key.upArrow || input === "k") {
      newIndex = selectedIndex - 1;
      while (
        newIndex >= 0 &&
        isVideoGroup(flatList[newIndex] as VideoItem | VideoGroup)
      ) {
        newIndex--;
      }
      newIndex = Math.max(0, newIndex);
    } else if (key.downArrow || input === "j") {
      newIndex = selectedIndex + 1;
      while (
        newIndex < flatList.length &&
        isVideoGroup(flatList[newIndex] as VideoItem | VideoGroup)
      ) {
        newIndex++;
      }
      newIndex = Math.min(flatList.length - 1, newIndex);
    } else if (key.return || input === "o") {
      if (selectedItem && !isVideoGroup(selectedItem)) {
        onSelect(selectedItem as VideoItem);
      }
    } else if (input === "q" || key.escape) {
      onExit();
    } else if (input === "r") {
      onRefresh?.();
    } else if (input === "p") {
      setShowPreview(prev => !prev);
    }

    // Update selected index
    setSelectedIndex(newIndex);

    // Update scroll offset to keep selected item in view
    if (newIndex < scrollOffset) {
      setScrollOffset(newIndex);
    } else if (newIndex >= scrollOffset + listHeight) {
      setScrollOffset(Math.max(0, newIndex - listHeight + 1));
    }
  });

  const visibleItems = flatList.slice(scrollOffset, scrollOffset + listHeight);

  return (
    <Box
      flexDirection="column"
      height={terminalHeight}
      width={terminalWidth}
    >
      <AppHeader
        refreshing={refreshing}
        refreshStatus={refreshStatus}
        refreshProgress={refreshProgress}
        lastUpdated={lastUpdated || null}
        cacheAge={cacheAge}
      />

      <Box flexDirection="row" flexGrow={1}>
        <VideoListItems
          visibleItems={visibleItems}
          selectedIndex={selectedIndex}
          scrollOffset={scrollOffset}
          channelWidth={columnWidths.channelWidth}
          titleWidth={columnWidths.titleWidth}
          dateWidth={columnWidths.dateWidth}
          listWidth={listWidth}
        />

        {showPreview && (
          <ThumbnailPreview
            video={selectedVideo}
            width={thumbnailWidth}
            height={listHeight}
          />
        )}
      </Box>

      <AppFooter
        selectedVideo={selectedVideo}
        listWidth={listWidth}
      />
    </Box>
  );
}
