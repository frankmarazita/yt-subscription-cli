import React from "react";
import { Box, Text } from "ink";
import { getApiBaseUrl } from "../services/api-client";

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
  const apiUrl = getApiBaseUrl();
  const host = (() => {
    try {
      const u = new URL(apiUrl);
      return u.host;
    } catch {
      return apiUrl;
    }
  })();

  return (
    <Box justifyContent="space-between">
      <Text color="cyan">📺 subs</Text>
      <Box gap={2}>
        {refreshing && <Text color="yellow">🔄 Refreshing...</Text>}
        {lastUpdated && !refreshing && (
          <Text color="gray">
            Updated {cacheAge === 0 ? "just now" : `${cacheAge}m ago`}
          </Text>
        )}
        <Text color="gray">⇄ {host}</Text>
      </Box>
    </Box>
  );
}

export const AppHeader = React.memo(AppHeaderComponent);
