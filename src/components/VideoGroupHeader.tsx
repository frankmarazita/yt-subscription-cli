import React from "react";
import { Box, Text } from "ink";
import type { VideoGroup } from "../types";

interface VideoGroupHeaderProps {
  group: VideoGroup;
}

function VideoGroupHeaderComponent({ group }: VideoGroupHeaderProps) {
  return (
    <Box key={group.label} marginBottom={1} marginTop={1}>
      <Text color="cyan" bold>
        {group.label} ({group.videos.length} videos)
      </Text>
    </Box>
  );
}

// Memoize to prevent unnecessary re-renders
export const VideoGroupHeader = React.memo(VideoGroupHeaderComponent);