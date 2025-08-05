import React from "react";
import { Box, Text } from "ink";
import { formatTimeAgo, getChannelColor } from "../utils/dateUtils";
import type { VideoItem as VideoItemType } from "../types";

interface VideoItemProps {
  video: VideoItemType;
  isSelected: boolean;
  channelWidth: number;
  titleWidth: number;
  dateWidth: number;
}

function VideoItemComponent({ video, isSelected, channelWidth, titleWidth, dateWidth }: VideoItemProps) {
  const bgColor = isSelected ? "yellow" : undefined;
  const textColor = isSelected ? "black" : undefined;
  const channelColor = getChannelColor(video.channel);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;
  };

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
}

// Memoize to prevent re-renders when props haven't changed
export const VideoItem = React.memo(VideoItemComponent);