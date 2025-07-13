import React from 'react';
import { Box, Text, useStdout } from 'ink';
import Spinner from 'ink-spinner';

interface LoadingScreenProps {
  text: string;
  progress?: { current: number; total: number };
}

export function LoadingScreen({ text, progress }: LoadingScreenProps) {
  const { stdout } = useStdout();
  const height = stdout?.rows || 24;
  
  return (
    <Box 
      height={height} 
      justifyContent="center" 
      alignItems="center" 
      flexDirection="column"
    >
      <Box marginBottom={2}>
        <Text color="cyan" bold>📺 YouTube Subscription CLI</Text>
      </Box>
      
      {progress && progress.total > 0 ? (
        <Box flexDirection="column" alignItems="center">
          <Text color="cyan">{text}</Text>
          <Box marginTop={1}>
            <Text color="green">
              [{progress.current}/{progress.total}] {Math.round((progress.current / progress.total) * 100)}%
            </Text>
          </Box>
          <Box marginTop={1} width={50}>
            <Text color="gray">
              {'█'.repeat(Math.floor((progress.current / progress.total) * 50))}{'░'.repeat(50 - Math.floor((progress.current / progress.total) * 50))}
            </Text>
          </Box>
        </Box>
      ) : (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> {text}</Text>
        </Box>
      )}
      
      <Box marginTop={2}>
        <Text color="gray">Please wait while we fetch your videos...</Text>
      </Box>
    </Box>
  );
}