import React from "react";
import { Box, Text } from "ink";

interface AppHeaderProps {
  refreshing: boolean;
  refreshStatus: string;
  refreshProgress: { current: number; total: number };
  lastUpdated: Date | null;
  cacheAge: number;
}

function AppHeaderComponent({
  refreshing,
  refreshStatus,
  refreshProgress,
  lastUpdated,
  cacheAge,
}: AppHeaderProps) {
  return (
    <Box justifyContent="space-between">
      <Text color="cyan">📺 YouTube Subscription Feed</Text>
      <Box>
        {refreshing && (
          <Text color="yellow">
            🔄 {refreshStatus} {refreshProgress.current}/{refreshProgress.total}
          </Text>
        )}
        {lastUpdated && !refreshing && (
          <Text color="gray">
            Updated {cacheAge === 0 ? "just now" : `${cacheAge}m ago`}
          </Text>
        )}
      </Box>
    </Box>
  );
}

// Memoize to prevent re-renders when refresh state hasn't changed
export const AppHeader = React.memo(AppHeaderComponent);
