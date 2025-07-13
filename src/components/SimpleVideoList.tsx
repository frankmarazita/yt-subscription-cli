import { Box, Text, useStdout } from "ink";
import Spinner from "ink-spinner";
import Link from "ink-link";
import { groupVideosByDays, formatTimeAgo } from "../utils/dateUtils";
import type { VideoItem } from "../types";

interface SimpleVideoListProps {
  videos: VideoItem[];
  onSelect: (video: VideoItem) => void;
  onExit: () => void;
  refreshing?: boolean;
  lastUpdated?: Date | null;
  cacheAge?: number;
}

export function SimpleVideoList({
  videos,
  refreshing = false,
  lastUpdated,
  cacheAge = 0,
}: SimpleVideoListProps) {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;
  };

  const separatorLine = "=".repeat(Math.max(terminalWidth - 4, 40));
  const videoGroups = groupVideosByDays(videos);

  return (
    <Box flexDirection="column" width={terminalWidth}>
      {/* Header */}
      <Box paddingX={1} marginBottom={1} justifyContent="space-between">
        <Text color="cyan" bold>
          📺 YouTube Subscription CLI - Latest Videos
        </Text>
        <Box>
          {refreshing && (
            <Text color="yellow">
              <Spinner type="dots" /> Refreshing...
            </Text>
          )}
          {lastUpdated && !refreshing && (
            <Text color="gray">
              Updated {cacheAge === 0 ? "just now" : `${cacheAge}m ago`}
            </Text>
          )}
        </Box>
      </Box>

      {/* Stats */}
      <Box paddingX={1} marginBottom={1}>
        <Text color="green">🎯 Found {videos.length} videos</Text>
      </Box>

      {videoGroups.map((group, groupIndex) => (
        <Box
          key={`${group.label}-${groupIndex}`}
          flexDirection="column"
          marginBottom={2}
        >
          {/* Day Header */}
          <Box paddingX={1} marginBottom={1}>
            <Text color="cyan" bold>
              {group.label} ({group.videos.length} videos)
            </Text>
          </Box>

          {/* Videos in this day */}
          {group.videos.map((video, videoIndex) => {
            const availableWidth = Math.max(terminalWidth - 10, 60);
            const channelWidth = Math.floor(availableWidth * 0.25);
            const titleWidth = Math.floor(availableWidth * 0.55);
            const channel = truncateText(video.channel, channelWidth);
            const title = truncateText(video.title, titleWidth);
            const timeAgo = formatTimeAgo(video.published);
            const type = video.isShort ? "🎬 Short" : "🎥 Video";

            return (
              <Box
                key={video.link}
                paddingX={2}
                marginBottom={1}
                width={terminalWidth}
              >
                <Box flexDirection="column" width="100%">
                  <Text>
                    <Text color="yellow">{channel}</Text> | {title} |{" "}
                    <Text color="green">{timeAgo}</Text> |{" "}
                    <Text color="magenta">{type}</Text>
                  </Text>
                  <Box marginLeft={2}>
                    <Text color="gray">🔗 </Text>
                    <Link url={video.link}>
                      <Text color="blue">{video.link}</Text>
                    </Link>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Footer */}
      <Box paddingX={1} marginTop={1}>
        <Text color="gray">{separatorLine}</Text>
      </Box>
      <Box paddingX={1} flexDirection="column">
        <Text color="gray">Showing {videos.length} videos</Text>
        <Text color="gray">
          💡 Tip: Use Ctrl+Click or Cmd+Click to open video links in your
          browser
        </Text>
      </Box>
    </Box>
  );
}
