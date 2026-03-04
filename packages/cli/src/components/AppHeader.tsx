import React from "react";
import { Box, Text } from "ink";

interface AppHeaderProps {
  refreshing: boolean;
  lastUpdated: Date | null;
  cacheAge: number;
}

function AppHeaderComponent({
  refreshing,
  lastUpdated,
  cacheAge,
}: AppHeaderProps) {
  return (
    <Box justifyContent="space-between">
      <Text color="cyan">📺 subs</Text>
      <Box>
        {refreshing && <Text color="yellow">🔄 Refreshing...</Text>}
        {lastUpdated && !refreshing && (
          <Text color="gray">
            Updated {cacheAge === 0 ? "just now" : `${cacheAge}m ago`}
          </Text>
        )}
      </Box>
    </Box>
  );
}

export const AppHeader = React.memo(AppHeaderComponent);
