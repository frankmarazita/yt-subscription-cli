import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { refreshVideosMutationKey } from "../hooks/useVideosQuery";
import { useConfigStore } from "../store/configStore";

interface AppHeaderProps {
  lastUpdated: Date | null;
  cacheAge: number;
}

function AppHeaderComponent({ lastUpdated, cacheAge }: AppHeaderProps) {
  const activeUrl = useConfigStore((state) => state.getActiveApiUrl());
  const isFetching = useIsFetching();
  const isRefreshing = useIsMutating({ mutationKey: refreshVideosMutationKey }) > 0;
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  const host = (() => {
    try {
      return new URL(activeUrl).host;
    } catch {
      return activeUrl;
    }
  })();

  return (
    <Box justifyContent="space-between">
      <Text color="cyan">📺 subs</Text>
      <Box gap={2}>
        {isLoading && (
          <Box gap={1}>
            <Text color="yellow"><Spinner type="dots" /></Text>
            {isRefreshing && <Text color="yellow">Refreshing</Text>}
          </Box>
        )}
        {lastUpdated && !isLoading && (
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
