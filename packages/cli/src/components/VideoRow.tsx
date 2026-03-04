import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { formatTimeAgo, getChannelColor } from "../utils/dateUtils";
import type { VideoItem } from "../types";

interface VideoRowProps {
  video: VideoItem;
  isSelected: boolean;
  channelWidth: number;
  titleWidth: number;
  dateWidth: number;
  isInWatchLater: boolean;
  isWatched: boolean;
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.substring(0, max - 3) + "...";
}

function getDateColor(published: Date): string {
  const hoursAgo =
    (Date.now() - published.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 2) return "red";
  if (hoursAgo < 24) return "yellow";
  if (hoursAgo < 168) return "cyan";
  return "green";
}

function VideoRowComponent({
  video,
  isSelected,
  channelWidth,
  titleWidth,
  dateWidth,
  isInWatchLater,
  isWatched,
}: VideoRowProps) {
  const channelColor = useMemo(() => getChannelColor(video.channel), [video.channel]);
  const dateColor = useMemo(() => getDateColor(video.published), [video.published]);
  const timeAgo = useMemo(() => formatTimeAgo(video.published) || "Unknown Time", [video.published]);
  const titleColor = isSelected ? "yellow" : "white";

  return (
    <Box
      width="100%"
      paddingX={1}
      {...(isSelected ? { backgroundColor: "yellow" } : {})}
    >
      <Box flexDirection="row" width="100%">
        <Box width={3} marginRight={1} flexShrink={0}>
          <Text color="yellow">{isInWatchLater ? "★ " : "  "}</Text>
          <Text color="cyan">{isWatched ? "●" : "○"}</Text>
        </Box>
        <Box width={channelWidth - 4} marginRight={2} flexShrink={0} overflow="hidden">
          <Text color={channelColor}>{truncate(video.channel, channelWidth)}</Text>
        </Box>
        <Box width={titleWidth} marginRight={2} flexShrink={0} overflow="hidden">
          <Text color={titleColor} underline={isSelected}>
            {truncate(video.title, titleWidth)}
          </Text>
        </Box>
        <Box width={dateWidth} flexShrink={0} overflow="hidden">
          <Text color={dateColor}>{timeAgo}</Text>
        </Box>
      </Box>
    </Box>
  );
}

export const VideoRow = React.memo(VideoRowComponent);
