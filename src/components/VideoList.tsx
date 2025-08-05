import React, { useMemo, useEffect, useRef, useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { formatTimeAgo, getChannelColor } from "../utils/dateUtils";
import { ThumbnailPreview } from "./ThumbnailPreview";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { useAppStore } from "../store/appStore";
import type { VideoItem } from "../types";

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

interface VideoRowProps {
  video: VideoItem;
  isSelected: boolean;
  channelWidth: number;
  titleWidth: number;
  dateWidth: number;
  isInWatchLater: boolean;
}

function VideoRow({
  video,
  isSelected,
  channelWidth,
  titleWidth,
  dateWidth,
  isInWatchLater,
}: VideoRowProps) {
  const bgColor = isSelected ? "yellow" : "";
  const textColor = isSelected ? "black" : "white";

  const truncate = (text: string, max: number) => {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.substring(0, max - 3) + "...";
  };

  const channelColor = isSelected ? "black" : getChannelColor(video.channel);
  const titleColor = textColor;
  const dateColor = isSelected ? "black" : "green";
  const timeAgo = formatTimeAgo(video.published);

  const displayChannel = truncate(video.channel, channelWidth);
  const displayTitle = truncate(video.title, titleWidth);
  const displayTime = timeAgo || "Unknown Time";

  return (
    <Box
      width="100%"
      paddingX={1}
      {...(isSelected ? { backgroundColor: "yellow" } : {})}
    >
      <Box flexDirection="row" width="100%">
        <Box width={2} marginRight={1} flexShrink={0}>
          <Text color={isSelected ? "black" : "yellow"}>
            {isInWatchLater ? "★" : " "}
          </Text>
        </Box>
        <Box
          width={channelWidth - 3}
          marginRight={2}
          flexShrink={0}
          overflow="hidden"
        >
          <Text color={channelColor}>{displayChannel}</Text>
        </Box>
        <Box
          width={titleWidth}
          marginRight={2}
          flexShrink={0}
          overflow="hidden"
        >
          <Text color={titleColor}>{displayTitle}</Text>
        </Box>
        <Box width={dateWidth} flexShrink={0} overflow="hidden">
          <Text color={dateColor}>{displayTime}</Text>
        </Box>
      </Box>
    </Box>
  );
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

  // Use stdout dimensions directly - let Ink handle resizing
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;

  // Store state - declare these first!
  const [currentSelection, setCurrentSelection] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const showPreview = useAppStore((state) => state.showPreview);
  const togglePreview = useAppStore((state) => state.togglePreview);
  const toggleVideoWatchLater = useAppStore(
    (state) => state.toggleVideoWatchLater
  );
  const isVideoInWatchLater = useAppStore((state) => state.isVideoInWatchLater);

  // Reset scroll position when dimensions change to prevent UI issues
  useEffect(() => {
    setScrollOffset(0);
  }, [terminalWidth, terminalHeight, setScrollOffset]);

  // Dynamic layout calculations with better space utilization
  const thumbnailWidth = showPreview
    ? Math.min(60, Math.floor(terminalWidth * 0.5))
    : 0;
  const listWidth = terminalWidth - thumbnailWidth;
  const listHeight = Math.max(1, terminalHeight - 10);

  // More sophisticated column width calculation
  const availableWidth = listWidth - 15; // Account for padding, margins, and separators
  const minChannelWidth = 20;
  const minTitleWidth = 40;
  const minDateWidth = 12;

  // Calculate optimal column widths based on available space
  const calculateColumnWidths = (available: number) => {
    // Start with minimum widths
    let remaining = available - minChannelWidth - minTitleWidth - minDateWidth;

    if (remaining > 0) {
      // Distribute extra space: 20% to channel, 65% to title, 15% to date
      const extraChannel = Math.floor(remaining * 0.2);
      const extraTitle = Math.floor(remaining * 0.65);
      const extraDate = remaining - extraChannel - extraTitle;

      return {
        channelWidth: minChannelWidth + extraChannel,
        titleWidth: minTitleWidth + extraTitle,
        dateWidth: minDateWidth + extraDate,
      };
    } else {
      // If we're really tight on space, prioritize title
      const totalMin = minChannelWidth + minTitleWidth + minDateWidth;
      const scale = Math.min(1, available / totalMin);

      let channelWidth = Math.max(15, Math.floor(minChannelWidth * scale));
      let titleWidth = Math.max(30, Math.floor(minTitleWidth * scale));
      let dateWidth = Math.max(10, Math.floor(minDateWidth * scale));

      // Ensure we don't exceed available width
      let totalUsed = channelWidth + titleWidth + dateWidth;
      if (totalUsed > available) {
        const overflow = totalUsed - available;
        // Remove overflow from title first (it's usually the longest)
        titleWidth = Math.max(15, titleWidth - overflow);

        // If still overflowing, adjust other columns
        totalUsed = channelWidth + titleWidth + dateWidth;
        if (totalUsed > available) {
          const remainingOverflow = totalUsed - available;
          dateWidth = Math.max(8, dateWidth - Math.ceil(remainingOverflow / 2));
          channelWidth = Math.max(
            12,
            channelWidth - Math.floor(remainingOverflow / 2)
          );
        }
      }

      return { channelWidth, titleWidth, dateWidth };
    }
  };

  const columnWidths = useMemo(
    () => calculateColumnWidths(availableWidth),
    [availableWidth]
  );

  useEffect(() => {
    if (videos.length > 0) {
      setCurrentSelection(0);
      setScrollOffset(0);
    }
  }, [videos]);

  // Get currently selected video (simplified)
  const selectedVideo = useMemo(() => {
    return videos[currentSelection] || null;
  }, [videos, currentSelection]);

  // Simplified navigation for flat list
  const navigateUp = () => {
    if (videos.length === 0) return;
    const newIndex = Math.max(0, currentSelection - 1);
    setCurrentSelection(newIndex);
  };

  const navigateDown = () => {
    if (videos.length === 0) return;
    const newIndex = Math.min(videos.length - 1, currentSelection + 1);
    setCurrentSelection(newIndex);
  };

  const pageUp = () => {
    if (videos.length === 0) return;
    const pageSize = Math.max(1, listHeight - 1);
    const newIndex = Math.max(0, currentSelection - pageSize);
    setCurrentSelection(newIndex);
  };

  const pageDown = () => {
    if (videos.length === 0) return;
    const pageSize = Math.max(1, listHeight - 1);
    const newIndex = Math.min(videos.length - 1, currentSelection + pageSize);
    setCurrentSelection(newIndex);
  };

  // Update scroll offset based on selection (simplified)
  useEffect(() => {
    if (currentSelection < scrollOffset) {
      setScrollOffset(currentSelection);
    } else if (currentSelection >= scrollOffset + listHeight) {
      setScrollOffset(currentSelection - listHeight + 1);
    }
  }, [currentSelection, listHeight, scrollOffset]);

  // Keyboard input handling
  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      navigateUp();
    } else if (key.downArrow || input === "j") {
      navigateDown();
    } else if (key.pageUp) {
      pageUp();
    } else if (key.pageDown) {
      pageDown();
    } else if (key.return || input === "o") {
      if (selectedVideo) {
        onSelect(selectedVideo);
      }
    } else if (input === "q" || key.escape) {
      onExit();
    } else if (input === "r") {
      onRefresh?.();
    } else if (input === "p") {
      togglePreview();
    } else if (input === "w") {
      if (selectedVideo) {
        toggleVideoWatchLater(selectedVideo.videoId);
      }
    }
  });

  const renderVisibleItems = () => {
    const items: React.ReactNode[] = [];
    const startIndex = scrollOffset;
    const endIndex = Math.min(startIndex + listHeight, videos.length);

    for (let i = startIndex; i < endIndex; i++) {
      const video = videos[i];
      if (!video) continue; // Ensure video is not undefined
      const isSelected = i === currentSelection;

      items.push(
        <VideoRow
          key={video.videoId}
          video={video}
          isSelected={isSelected}
          channelWidth={columnWidths.channelWidth}
          titleWidth={columnWidths.titleWidth}
          dateWidth={columnWidths.dateWidth}
          isInWatchLater={isVideoInWatchLater(video.videoId)}
        />
      );
    }

    return items;
  };

  return (
    <Box flexDirection="column" height={terminalHeight} width={terminalWidth}>
      <AppHeader
        refreshing={refreshing}
        refreshStatus={refreshStatus}
        refreshProgress={refreshProgress}
        lastUpdated={lastUpdated || null}
        cacheAge={cacheAge}
      />

      <Box flexDirection="row" flexGrow={1} marginTop={1}>
        <Box flexDirection="column" width={listWidth} paddingX={1}>
          {/* Column headers */}
          <Box marginBottom={1} paddingX={1}>
            <Box flexDirection="row" width="100%">
              <Box width={2} marginRight={1}>
                <Text color="gray" bold></Text>
              </Box>
              <Box width={columnWidths.channelWidth - 3} marginRight={2}>
                <Text color="gray" bold>
                  CHANNEL
                </Text>
              </Box>
              <Box width={columnWidths.titleWidth} marginRight={2}>
                <Text color="gray" bold>
                  TITLE
                </Text>
              </Box>
              <Box width={columnWidths.dateWidth}>
                <Text color="gray" bold>
                  PUBLISHED
                </Text>
              </Box>
            </Box>
          </Box>

          <Box flexDirection="column" height={listHeight} marginBottom={2}>
            {renderVisibleItems()}
          </Box>
        </Box>

        {showPreview && (
          <ThumbnailPreview
            video={selectedVideo}
            width={thumbnailWidth + 2}
            height={listHeight + 2}
          />
        )}
      </Box>

      <AppFooter selectedVideo={selectedVideo} listWidth={terminalWidth} />
    </Box>
  );
}
