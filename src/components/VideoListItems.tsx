import React from "react";
import { Box } from "ink";
import { VideoItem } from "./VideoItem";
import { VideoGroupHeader } from "./VideoGroupHeader";
import type { VideoItem as VideoItemType, VideoGroup } from "../types";

interface VideoListItemsProps {
  visibleItems: (VideoGroup | VideoItemType)[];
  selectedIndex: number;
  scrollOffset: number;
  channelWidth: number;
  titleWidth: number;
  dateWidth: number;
  listWidth: number;
}

function isVideoGroup(item: VideoItemType | VideoGroup): item is VideoGroup {
  return (item as VideoGroup).videos !== undefined;
}

function VideoListItemsComponent({
  visibleItems,
  selectedIndex,
  scrollOffset,
  channelWidth,
  titleWidth,
  dateWidth,
  listWidth,
}: VideoListItemsProps) {
  return (
    <Box flexDirection="column" width={listWidth}>
      {visibleItems.map((item, index) => {
        const actualIndex = scrollOffset + index;
        const isSelected = actualIndex === selectedIndex;

        if (isVideoGroup(item)) {
          return <VideoGroupHeader key={item.label} group={item} />;
        }

        return (
          <VideoItem
            key={(item as VideoItemType).link}
            video={item as VideoItemType}
            isSelected={isSelected}
            channelWidth={channelWidth}
            titleWidth={titleWidth}
            dateWidth={dateWidth}
          />
        );
      })}
    </Box>
  );
}

// Memoize with custom comparison to prevent re-renders
export const VideoListItems = React.memo(VideoListItemsComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.selectedIndex === nextProps.selectedIndex &&
    prevProps.scrollOffset === nextProps.scrollOffset &&
    prevProps.visibleItems === nextProps.visibleItems &&
    prevProps.channelWidth === nextProps.channelWidth &&
    prevProps.titleWidth === nextProps.titleWidth &&
    prevProps.dateWidth === nextProps.dateWidth &&
    prevProps.listWidth === nextProps.listWidth
  );
});