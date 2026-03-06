import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { useWebSocket } from './hooks/useWebSocket';
import { useVideoScreen } from './hooks/useVideoScreen';
import { VideoCard } from './components/VideoCard';
import { Settings } from './components/Settings';
import './App.css';

type Tab = 'videos' | 'watchLater' | 'settings';

function WebSocketProvider() {
  useWebSocket();
  return null;
}

function VideoList({ filterWatchLater }: { filterWatchLater?: boolean }) {
  const { videos, isLoading, error, watchedIds, watchLaterIds, toggleWatched, toggleWatchLater } = useVideoScreen();

  if (isLoading) return <div className="state-msg">Loading...</div>;
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return <div className="state-msg error">{msg}</div>;
  }

  const filtered = filterWatchLater
    ? videos?.filter((v) => watchLaterIds.has(v.videoId))
    : videos;

  if (!filtered?.length) return <div className="state-msg muted">No videos</div>;

  return (
    <div className="video-list">
      {filtered.map((video) => (
        <VideoCard
          key={video.videoId}
          video={video}
          isWatched={watchedIds.has(video.videoId)}
          isWatchLater={watchLaterIds.has(video.videoId)}
          onToggleWatched={() => toggleWatched(video.videoId)}
          onToggleWatchLater={() => toggleWatchLater(video.videoId)}
        />
      ))}
    </div>
  );
}

function AppContent() {
  const [tab, setTab] = useState<Tab>('videos');

  return (
    <div className="app">
      <div className="content">
        {tab === 'videos' && <VideoList />}
        {tab === 'watchLater' && <VideoList filterWatchLater />}
        {tab === 'settings' && <Settings />}
      </div>
      <nav className="tab-bar">
        <button className={`tab ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>
          <span>▶</span> Videos
        </button>
        <button className={`tab ${tab === 'watchLater' ? 'active' : ''}`} onClick={() => setTab('watchLater')}>
          <span>🔖</span> Watch Later
        </button>
        <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
          <span>⚙</span> Settings
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider />
      <AppContent />
    </QueryClientProvider>
  );
}
