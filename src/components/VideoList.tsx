import { useState, useMemo, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import Spinner from "ink-spinner";
import {
  groupVideosByDays,
  formatTimeAgo,
  getChannelColor,
} from "../utils/dateUtils";
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
  const listHeight = Math.max(10, (stdout?.rows || 24) - 8);

  const videoGroups = useMemo(() => groupVideosByDays(videos), [videos]);

  const flatList = useMemo(() => {
    const items: (VideoGroup | VideoItem)[] = [];
    videoGroups.forEach((group) => {
      items.push(group);
      items.push(...group.videos);
    });
    return items;
  }, [videoGroups]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const firstVideoIndex = flatList.findIndex((item) => !isVideoGroup(item));
    setSelectedIndex(firstVideoIndex !== -1 ? firstVideoIndex : 0);
    setScrollOffset(0);
  }, [videos, flatList]);

  const selectedItem = flatList[selectedIndex];

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      let newIndex = selectedIndex - 1;
      while (
        newIndex >= 0 &&
        isVideoGroup(flatList[newIndex] as VideoItem | VideoGroup)
      ) {
        newIndex--;
      }
      setSelectedIndex(Math.max(0, newIndex));
    } else if (key.downArrow || input === "j") {
      let newIndex = selectedIndex + 1;
      while (
        newIndex < flatList.length &&
        isVideoGroup(flatList[newIndex] as VideoItem | VideoGroup)
      ) {
        newIndex++;
      }
      setSelectedIndex(Math.min(flatList.length - 1, newIndex));
    } else if (key.return || input === "o") {
      if (selectedItem && !isVideoGroup(selectedItem)) {
        onSelect(selectedItem as VideoItem);
      }
    } else if (input === "q" || key.escape) {
      onExit();
    } else if (input === "r") {
      onRefresh?.();
    }

    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + listHeight) {
      setScrollOffset(selectedIndex - listHeight + 1);
    }
  });

  const visibleItems = flatList.slice(scrollOffset, scrollOffset + listHeight);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;
  };

  return (
    <Box
      flexDirection="column"
      height={stdout?.rows || 24}
      width={terminalWidth}
    >
      <Box justifyContent="space-between">
        <Text color="cyan">📺 YouTube Subscription Feed</Text>
        <Box>
          {refreshing && (
            <Text color="yellow">
              <Spinner type="dots" /> {refreshStatus} {refreshProgress.current}/
              {refreshProgress.total}
            </Text>
          )}
          {lastUpdated && !refreshing && (
            <Text color="gray">
              Updated {cacheAge === 0 ? "just now" : `${cacheAge}m ago`}
            </Text>
          )}
        </Box>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        {visibleItems.map((item, index) => {
          const actualIndex = scrollOffset + index;
          const isSelected = actualIndex === selectedIndex;

          if (isVideoGroup(item)) {
            return (
              <Box key={item.label} marginBottom={1} marginTop={1}>
                <Text color="cyan" bold>
                  {item.label} ({item.videos.length} videos)
                </Text>
              </Box>
            );
          }

          const video = item as VideoItem;
          const bgColor = isSelected ? "yellow" : undefined; // Brighter color for selected item
          const textColor = isSelected ? "black" : undefined; // Black text on yellow background
          const channelColor = getChannelColor(video.channel); // Get unique color for channel

          // Calculate available width for content within the item
          const contentWidth = terminalWidth;
          const channelWidth = Math.floor(contentWidth * 0.15);
          const titleWidth = Math.floor(contentWidth * 0.75);
          const dateWidth = Math.floor(contentWidth * 0.1);

          return (
            <Box key={video.link} width="100%">
              <Box flexGrow={1} flexDirection="row">
                <Box width={channelWidth}>
                  <Text
                    color={isSelected ? "black" : channelColor}
                    backgroundColor={bgColor}
                    bold={isSelected}
                  >
                    {truncateText(video.channel, channelWidth)}
                  </Text>
                </Box>
                <Box width={titleWidth}>
                  <Text
                    color={textColor}
                    backgroundColor={bgColor}
                    bold={isSelected}
                  >
                    {truncateText(video.title, titleWidth)}
                  </Text>
                </Box>
                <Box width={dateWidth}>
                  <Text
                    color={isSelected ? "black" : "green"}
                    backgroundColor={bgColor}
                    bold={isSelected}
                  >
                    {formatTimeAgo(video.published)}
                  </Text>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box height={3}>
        <Box flexDirection="column" flexGrow={1}>
          <Text color="gray">
            {"=".repeat(Math.max(terminalWidth - 4, 40))}
          </Text>
          {selectedItem && !isVideoGroup(selectedItem) && (
            <>
              <Text color="cyan">
                Selected:{" "}
                {truncateText(
                  (selectedItem as VideoItem).title || "None",
                  Math.floor(terminalWidth * 0.8)
                )}
              </Text>
              <Text color="gray">
                Channel: {(selectedItem as VideoItem).channel || "N/A"} | Date:{" "}
                {(selectedItem as VideoItem).publishedDateTime || "N/A"}
              </Text>
            </>
          )}
        </Box>
      </Box>

      <Box justifyContent="center">
        <Text color="gray">
          ↑↓/jk: Navigate | Enter/o: Open | r: Refresh | q/Esc: Quit
        </Text>
      </Box>
    </Box>
  );
}
