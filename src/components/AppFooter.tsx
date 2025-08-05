import React from "react";
import { Box, Text } from "ink";
import type { VideoItem } from "../types";

interface AppFooterProps {
  selectedVideo: VideoItem | null;
  listWidth: number;
}

function AppFooterComponent({ selectedVideo, listWidth }: AppFooterProps) {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;
  };

  return (
    <>
      <Box height={3}>
        <Box flexDirection="column" flexGrow={1}>
          <Text color="gray">{"=".repeat(listWidth)}</Text>
          {selectedVideo && (
            <>
              <Text color="cyan">
                {truncateText(
                  selectedVideo.title || "None",
                  Math.floor(listWidth * 0.8)
                )}
              </Text>
              <Text color="gray">
                {selectedVideo.channel || "N/A"} | Date:{" "}
                {selectedVideo.publishedDateTime || "N/A"}
              </Text>
            </>
          )}
        </Box>
      </Box>

      <Box justifyContent="center">
        <Text color="gray">
          ↑↓/jk: Navigate | Enter/o: Open | r: Refresh | p: Toggle Preview |
          q/Esc: Quit
        </Text>
      </Box>
    </>
  );
}

// Memoize to prevent re-renders when selected video hasn't changed
export const AppFooter = React.memo(AppFooterComponent);
