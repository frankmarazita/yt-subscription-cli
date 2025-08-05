import React from "react";
import { Box, Text } from "ink";
import type { VideoItem } from "../types";

interface AppFooterProps {
  selectedVideo: VideoItem | null;
  listWidth: number;
  showWatchLaterOnly?: boolean;
  watchLaterCount?: number;
  totalVideoCount?: number;
}

function AppFooterComponent({ 
  selectedVideo, 
  listWidth, 
  showWatchLaterOnly = false,
  watchLaterCount = 0,
  totalVideoCount = 0 
}: AppFooterProps) {
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
          {selectedVideo ? (
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
                {showWatchLaterOnly && (
                  <Text color="yellow"> | Watch Later Filter: ON ({watchLaterCount}/{totalVideoCount})</Text>
                )}
              </Text>
            </>
          ) : (
            showWatchLaterOnly && (
              <Text color="yellow">Watch Later Filter: ON ({watchLaterCount}/{totalVideoCount} videos)</Text>
            )
          )}
        </Box>
      </Box>

      <Box justifyContent="center">
        <Text color="gray">
          ↑↓/jk: Navigate | PgUp/PgDn: Jump | Enter/o: Open | w: Watch Later | m: Toggle Watched | l: Filter Watch Later |
          s: QR Code | r: Refresh | p: Preview | q/Esc: Quit
        </Text>
      </Box>
    </>
  );
}

// Memoize to prevent re-renders when selected video hasn't changed
export const AppFooter = React.memo(AppFooterComponent);
