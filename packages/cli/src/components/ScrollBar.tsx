import { Box, Text } from "ink";

interface ScrollBarProps {
  totalItems: number;
  visibleItems: number;
  scrollOffset: number;
  height: number;
}

export function ScrollBar({
  totalItems,
  visibleItems,
  scrollOffset,
  height,
}: ScrollBarProps) {
  // Don't show scrollbar if all items are visible
  if (totalItems <= visibleItems) {
    return null;
  }

  // Calculate scrollbar dimensions
  const scrollbarHeight = Math.max(1, height);
  const thumbHeight = Math.max(
    1,
    Math.floor((visibleItems / totalItems) * scrollbarHeight)
  );
  const scrollRange = scrollbarHeight - thumbHeight;

  // Calculate thumb position based on scroll offset (viewport position)
  const maxScrollPosition = totalItems - visibleItems;
  const scrollPosition = Math.min(scrollOffset, maxScrollPosition);
  const thumbPosition =
    maxScrollPosition > 0
      ? Math.floor((scrollPosition / maxScrollPosition) * scrollRange)
      : 0;

  // Generate scrollbar visual
  const scrollbarItems = [];
  for (let i = 0; i < scrollbarHeight; i++) {
    const isThumb = i >= thumbPosition && i < thumbPosition + thumbHeight;
    scrollbarItems.push(
      <Box key={i}>
        <Text color="gray">{isThumb ? "█" : "│"}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginLeft={1}>
      {scrollbarItems}
    </Box>
  );
}
