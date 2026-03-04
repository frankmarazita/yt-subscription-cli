import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { ScrollBar } from "./ScrollBar";
import { VideoRow } from "./VideoRow";
import { ThumbnailPreview } from "./ThumbnailPreview";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { QRCodeModal } from "./QRCodeModal";
import { useAppStore } from "../store/appStore";
import { useVideoNavigation } from "../hooks/useVideoNavigation";
import { useColumnWidths } from "../hooks/useColumnWidths";
import { useMouseScroll } from "../hooks/useMouseScroll";
import type { VideoItem } from "../types";

interface VideoListProps {
  videos: VideoItem[];
  onSelect: (video: VideoItem) => void;
  onSelectInViewer?: (video: VideoItem) => void;
  onExit: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: Date | null;
  cacheAge?: number;
  terminalWidth: number;
  terminalHeight: number;
}

export function VideoList({
  videos,
  onSelect,
  onSelectInViewer,
  onExit,
  onRefresh,
  refreshing = false,
  lastUpdated,
  cacheAge = 0,
  terminalWidth,
  terminalHeight,
}: VideoListProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  const showPreview = useAppStore((state) => state.showPreview);
  const showWatchLaterOnly = useAppStore((state) => state.showWatchLaterOnly);
  const togglePreview = useAppStore((state) => state.togglePreview);
  const toggleWatchLaterOnly = useAppStore((state) => state.toggleWatchLaterOnly);
  const toggleVideoWatchLater = useAppStore((state) => state.toggleVideoWatchLater);
  const markVideoAsWatched = useAppStore((state) => state.markVideoAsWatched);
  const toggleVideoWatchedStatus = useAppStore((state) => state.toggleVideoWatchedStatus);
  const watchLaterIds = useAppStore((state) => state.watchLaterIds);
  const isVideoInWatchLater = useAppStore((state) => state.isVideoInWatchLater);
  const isVideoWatched = useAppStore((state) => state.isVideoWatched);

  const filteredVideos = useMemo(() => {
    if (showWatchLaterOnly) {
      return videos.filter((video) => watchLaterIds.has(video.videoId));
    }
    return videos;
  }, [videos, showWatchLaterOnly, watchLaterIds]);

  const thumbnailWidth = showPreview ? Math.min(60, Math.floor(terminalWidth * 0.5)) : 0;
  const listWidth = terminalWidth - thumbnailWidth;
  const listHeight = Math.max(1, terminalHeight - 10);
  const columnWidths = useColumnWidths(listWidth - 15);

  const { currentSelection, scrollOffset, selectedVideo, nextVideo, navigateUp, navigateDown, pageUp, pageDown } =
    useVideoNavigation(filteredVideos, listHeight, showWatchLaterOnly);

  useMouseScroll(navigateUp, navigateDown);

  useInput((input, key) => {
    if (showQRModal) return;

    if (key.upArrow || input === "k") navigateUp();
    else if (key.downArrow || input === "j") navigateDown();
    else if (key.pageUp) pageUp();
    else if (key.pageDown) pageDown();
    else if (key.return || input === "o") {
      if (selectedVideo) {
        markVideoAsWatched(selectedVideo.videoId);
        onSelect(selectedVideo);
      }
    } else if (input === "q" || key.escape) onExit();
    else if (input === "r") onRefresh?.();
    else if (input === "p") togglePreview();
    else if (input === "w") {
      if (selectedVideo) toggleVideoWatchLater(selectedVideo.videoId);
    } else if (input === "l") toggleWatchLaterOnly();
    else if (input === "m") {
      if (selectedVideo) toggleVideoWatchedStatus(selectedVideo.videoId);
    } else if (input === "s") {
      if (selectedVideo) setShowQRModal(true);
    } else if (input === "v") {
      if (selectedVideo && onSelectInViewer) {
        markVideoAsWatched(selectedVideo.videoId);
        onSelectInViewer(selectedVideo);
      }
    }
  });

  const startIndex = scrollOffset;
  const endIndex = Math.min(startIndex + listHeight, filteredVideos.length);

  return (
    <Box flexDirection="column" height={terminalHeight} width={terminalWidth}>
      <AppHeader
        refreshing={refreshing}
        lastUpdated={lastUpdated || null}
        cacheAge={cacheAge}
      />

      <Box flexDirection="row" flexGrow={1} marginTop={1}>
        <Box
          flexDirection="column"
          width={listWidth}
          paddingX={1}
          marginRight={showPreview ? 1 : 0}
        >
          <Box marginBottom={1} paddingX={1}>
            <Box flexDirection="row" width="100%">
              <Box width={3} marginRight={1}>
                <Text color="gray" bold></Text>
              </Box>
              <Box width={columnWidths.channelWidth - 4} marginRight={2}>
                <Text color="gray" bold>CHANNEL</Text>
              </Box>
              <Box width={columnWidths.titleWidth} marginRight={2}>
                <Text color="gray" bold>TITLE</Text>
              </Box>
              <Box width={columnWidths.dateWidth}>
                <Text color="gray" bold>PUBLISHED</Text>
              </Box>
            </Box>
          </Box>

          <Box flexDirection="row" height={listHeight} marginBottom={2}>
            <Box flexDirection="column" flexGrow={1}>
              {filteredVideos.slice(startIndex, endIndex).map((video, i) => (
                <VideoRow
                  key={video.videoId}
                  video={video}
                  isSelected={startIndex + i === currentSelection}
                  channelWidth={columnWidths.channelWidth}
                  titleWidth={columnWidths.titleWidth}
                  dateWidth={columnWidths.dateWidth}
                  isInWatchLater={isVideoInWatchLater(video.videoId)}
                  isWatched={isVideoWatched(video.videoId)}
                />
              ))}
            </Box>
            <ScrollBar
              totalItems={filteredVideos.length}
              visibleItems={listHeight}
              scrollOffset={scrollOffset}
              height={listHeight}
            />
          </Box>
        </Box>

        {showPreview && (
          <Box width={thumbnailWidth} flexShrink={0}>
            <ThumbnailPreview
              video={selectedVideo}
              width={thumbnailWidth}
              height={listHeight + 2}
              preloadVideo={nextVideo}
            />
          </Box>
        )}
      </Box>

      <AppFooter
        selectedVideo={selectedVideo}
        listWidth={terminalWidth}
        showWatchLaterOnly={showWatchLaterOnly}
        watchLaterCount={filteredVideos.length}
        totalVideoCount={videos.length}
      />

      <QRCodeModal
        video={selectedVideo}
        isVisible={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </Box>
  );
}
