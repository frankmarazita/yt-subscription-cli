import { useMemo } from "react";

const MIN_CHANNEL = 20;
const MIN_TITLE = 40;
const MIN_DATE = 12;

function calculateColumnWidths(available: number) {
  const remaining = available - MIN_CHANNEL - MIN_TITLE - MIN_DATE;

  if (remaining > 0) {
    const extraChannel = Math.floor(remaining * 0.2);
    const extraTitle = Math.floor(remaining * 0.65);
    const extraDate = remaining - extraChannel - extraTitle;
    return {
      channelWidth: MIN_CHANNEL + extraChannel,
      titleWidth: MIN_TITLE + extraTitle,
      dateWidth: MIN_DATE + extraDate,
    };
  }

  const scale = Math.min(1, available / (MIN_CHANNEL + MIN_TITLE + MIN_DATE));
  let channelWidth = Math.max(15, Math.floor(MIN_CHANNEL * scale));
  let titleWidth = Math.max(30, Math.floor(MIN_TITLE * scale));
  let dateWidth = Math.max(10, Math.floor(MIN_DATE * scale));

  let totalUsed = channelWidth + titleWidth + dateWidth;
  if (totalUsed > available) {
    titleWidth = Math.max(15, titleWidth - (totalUsed - available));
    totalUsed = channelWidth + titleWidth + dateWidth;
    if (totalUsed > available) {
      const overflow = totalUsed - available;
      dateWidth = Math.max(8, dateWidth - Math.ceil(overflow / 2));
      channelWidth = Math.max(12, channelWidth - Math.floor(overflow / 2));
    }
  }

  return { channelWidth, titleWidth, dateWidth };
}

export function useColumnWidths(availableWidth: number) {
  return useMemo(() => calculateColumnWidths(availableWidth), [availableWidth]);
}
