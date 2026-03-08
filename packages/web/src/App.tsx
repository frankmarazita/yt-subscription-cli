import { useState, useRef, useEffect, useCallback } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { useWebSocket } from './hooks/useWebSocket';
import { useVideoScreen } from './hooks/useVideoScreen';
import { VideoCard } from './components/VideoCard';
import { Settings } from './components/Settings';

const PAGE_SIZE = 30;

type Tab = 'videos' | 'watchLater' | 'settings';

function WebSocketProvider() {
  useWebSocket();
  return null;
}

function VideoList({ filterWatchLater }: { filterWatchLater?: boolean }) {
  const { videos, isLoading, error, watchedIds, watchLaterIds, toggleWatched, toggleWatchLater } = useVideoScreen();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = filterWatchLater
    ? videos?.filter((v) => watchLaterIds.has(v.videoId))
    : videos;

  const loadMore = useCallback(() => {
    if (filtered && visibleCount < filtered.length) {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
    }
  }, [filtered, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterWatchLater]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (isLoading) return <div className="py-10 px-4 text-center text-sm text-[#333]">Loading...</div>;
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return <div className="py-10 px-4 text-center text-sm text-red-700">{msg}</div>;
  }

  if (!filtered?.length) return <div className="py-10 px-4 text-center text-sm text-gray-400">No videos</div>;

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="flex flex-col">
      {visible.map((video) => (
        <VideoCard
          key={video.videoId}
          video={video}
          isWatched={watchedIds.has(video.videoId)}
          isWatchLater={watchLaterIds.has(video.videoId)}
          onToggleWatched={() => toggleWatched(video.videoId)}
          onToggleWatchLater={() => toggleWatchLater(video.videoId)}
        />
      ))}
      {visibleCount < filtered.length && (
        <div ref={sentinelRef} className="py-10 px-4 text-center text-sm text-gray-400">Loading more...</div>
      )}
    </div>
  );
}

function AppContent() {
  const [tab, setTab] = useState<Tab>('videos');

  const tabClass = (t: Tab) =>
    `flex-1 flex flex-col items-center gap-[3px] py-2.5 border-0 bg-transparent cursor-pointer text-[11px] [-webkit-tap-highlight-color:transparent] ${tab === t ? 'text-[#2196f3]' : 'text-[#888]'}`;

  return (
    <div className="flex flex-col h-[100dvh] max-w-[600px] mx-auto bg-white">
      <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
        {tab === 'videos' && <VideoList />}
        {tab === 'watchLater' && <VideoList filterWatchLater />}
        {tab === 'settings' && <Settings />}
      </div>
      <nav className="flex border-t border-[#e0e0e0] bg-white pb-[env(safe-area-inset-bottom)]">
        <button className={tabClass('videos')} onClick={() => setTab('videos')}>
          <span className="text-[20px]">▶</span> Videos
        </button>
        <button className={tabClass('watchLater')} onClick={() => setTab('watchLater')}>
          <span className="text-[20px]">🔖</span> Watch Later
        </button>
        <button className={tabClass('settings')} onClick={() => setTab('settings')}>
          <span className="text-[20px]">⚙</span> Settings
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
