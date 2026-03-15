import React, { useMemo, useState, useRef, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { ScrollBar } from "./ScrollBar";
import { VideoRow } from "./VideoRow";
import { ThumbnailPreview } from "./ThumbnailPreview";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { QRCodeModal } from "./QRCodeModal";
import { useAppStore } from "../store/appStore";
import { useConfigStore } from "../store/configStore";
import { useVideoNavigation } from "../hooks/useVideoNavigation";
import { useColumnWidths } from "../hooks/useColumnWidths";
import { useMouseScroll } from "../hooks/useMouseScroll";
import { useThumbnailPreloader } from "../hooks/useThumbnailPreloader";
import { reinitializeClients } from "../services/client";
import { queryClient } from "../queryClient";
import type { VideoItem } from "../types";

interface VideoListProps {
  onSelect: (video: VideoItem) => void;
  onSelectInViewer?: (video: VideoItem) => void;
  onExit: () => void;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
  cacheAge?: number;
  terminalWidth: number;
  terminalHeight: number;
}

export function VideoList({
  onSelect,
  onSelectInViewer,
  onExit,
  onRefresh,
  lastUpdated,
  cacheAge = 0,
  terminalWidth,
  terminalHeight,
}: VideoListProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  const videos = useAppStore((state) => state.videos);
  const showPreview = useAppStore((state) => state.showPreview);
  const showWatchLaterOnly = useAppStore((state) => state.showWatchLaterOnly);
  const togglePreview = useAppStore((state) => state.togglePreview);
  const toggleWatchLaterOnly = useAppStore(
    (state) => state.toggleWatchLaterOnly
  );
  const toggleVideoWatchLater = useAppStore(
    (state) => state.toggleVideoWatchLater
  );
  const markVideoAsWatched = useAppStore((state) => state.markVideoAsWatched);
  const toggleVideoWatchedStatus = useAppStore(
    (state) => state.toggleVideoWatchedStatus
  );
  const watchLaterIds = useAppStore((state) => state.watchLaterIds);
  const watchedIds = useAppStore((state) => state.watchedIds);

  const filteredVideos = useMemo(() => {
    if (showWatchLaterOnly) {
      return videos.filter((video) => watchLaterIds.has(video.videoId));
    }
    return videos;
  }, [videos, showWatchLaterOnly, watchLaterIds]);

  const thumbnailWidth = showPreview
    ? Math.min(60, Math.floor(terminalWidth * 0.5))
    : 0;
  const listWidth = terminalWidth - thumbnailWidth;
  const listHeight = Math.max(1, terminalHeight - 10);
  const columnWidths = useColumnWidths(listWidth - 15);

  const {
    currentSelection,
    scrollOffset,
    selectedVideo,
    nextVideo,
    prevVideo,
    navigateUp,
    navigateDown,
    pageUp,
    pageDown,
  } = useVideoNavigation(filteredVideos, listHeight, showWatchLaterOnly);

  useMouseScroll(navigateUp, navigateDown);

  const handlerRef = useRef({
    showQRModal,
    navigateUp,
    navigateDown,
    pageUp,
    pageDown,
    selectedVideo,
    markVideoAsWatched,
    togglePreview,
    toggleVideoWatchLater,
    toggleWatchLaterOnly,
    toggleVideoWatchedStatus,
    setShowQRModal,
    onSelect,
    onExit,
    onRefresh,
    onSelectInViewer,
  });
  handlerRef.current = {
    showQRModal,
    navigateUp,
    navigateDown,
    pageUp,
    pageDown,
    selectedVideo,
    markVideoAsWatched,
    togglePreview,
    toggleVideoWatchLater,
    toggleWatchLaterOnly,
    toggleVideoWatchedStatus,
    setShowQRModal,
    onSelect,
    onExit,
    onRefresh,
    onSelectInViewer,
  };

  useInput(
    useCallback((input, key) => {
      const h = handlerRef.current;
      if (h.showQRModal) return;

      if (key.upArrow || input === "k") h.navigateUp();
      else if (key.downArrow || input === "j") h.navigateDown();
      else if (key.pageUp) h.pageUp();
      else if (key.pageDown) h.pageDown();
      else if (key.return || input === "o") {
        if (h.selectedVideo) {
          h.markVideoAsWatched(h.selectedVideo.videoId);
          h.onSelect(h.selectedVideo);
        }
      } else if (input === "q" || key.escape) h.onExit();
      else if (input === "r") h.onRefresh?.();
      else if (input === "p") h.togglePreview();
      else if (input === "w") {
        if (h.selectedVideo) h.toggleVideoWatchLater(h.selectedVideo.videoId);
      } else if (input === "l") h.toggleWatchLaterOnly();
      else if (input === "m") {
        if (h.selectedVideo)
          h.toggleVideoWatchedStatus(h.selectedVideo.videoId);
      } else if (input === "s") {
        if (h.selectedVideo) h.setShowQRModal(true);
      } else if (input === "v") {
        if (h.selectedVideo && h.onSelectInViewer) {
          h.markVideoAsWatched(h.selectedVideo.videoId);
          h.onSelectInViewer(h.selectedVideo);
        }
      } else if (input === "`") {
        useConfigStore.getState().cycleHost();
        reinitializeClients();
        queryClient.clear();
      }
    }, [])
  );

  const startIndex = scrollOffset;
  const endIndex = Math.min(startIndex + listHeight, filteredVideos.length);

  const preloadVideos = useMemo(
    () => [...filteredVideos.slice(startIndex, endIndex), nextVideo, prevVideo],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startIndex, endIndex, nextVideo, prevVideo, filteredVideos]
  );

  useThumbnailPreloader(showPreview ? preloadVideos : [], {
    width: thumbnailWidth,
    height: listHeight + 2,
  });

  return (
    <Box flexDirection="column" height={terminalHeight} width={terminalWidth}>
      <AppHeader lastUpdated={lastUpdated || null} cacheAge={cacheAge} />

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
                  isInWatchLater={watchLaterIds.has(video.videoId)}
                  isWatched={watchedIds.has(video.videoId)}
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
