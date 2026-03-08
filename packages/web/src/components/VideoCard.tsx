import type { VideoItem } from '../types';

interface Props {
  video: VideoItem;
  isWatched: boolean;
  isWatchLater: boolean;
  onToggleWatched: () => void;
  onToggleWatchLater: () => void;
}

const SWIPE_THRESHOLD = 60;

export function VideoCard({ video, isWatched, isWatchLater, onToggleWatched, onToggleWatchLater }: Props) {
  let startX = 0;
  let currentX = 0;

  function onTouchStart(e: React.TouchEvent) {
    startX = e.touches[0]!.clientX;
    currentX = startX;
  }

  function onTouchMove(e: React.TouchEvent) {
    currentX = e.touches[0]!.clientX;
  }

  function onTouchEnd() {
    const delta = currentX - startX;
    if (delta > SWIPE_THRESHOLD) onToggleWatched();
    else if (delta < -SWIPE_THRESHOLD) onToggleWatchLater();
  }

  function openVideo() {
    window.open(video.link, '_blank');
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 border-b border-[#e0e0e0] cursor-pointer select-none touch-pan-y [-webkit-tap-highlight-color:transparent] active:bg-[#f5f5f5] ${isWatched ? 'bg-[#fafafa]' : 'bg-white'}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={openVideo}
    >
      <div className="relative flex-shrink-0 w-[120px] h-[68px] rounded overflow-hidden bg-[#e0e0e0]">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#d0d0d0]" />
        )}
        {isWatched && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[22px]">✓</div>
        )}
        {isWatchLater && (
          <div className="absolute top-1 right-1 text-xs">🔖</div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className={`text-sm font-semibold leading-[1.4] line-clamp-2 ${isWatched ? 'text-[#999]' : 'text-[#111]'}`}>
          {video.title}
        </div>
        <div className="text-xs text-[#555] truncate">{video.channel}</div>
        <div className="text-[11px] text-[#999]">{video.publishedFormatted}</div>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          className={`w-8 h-8 border-none rounded-md cursor-pointer text-sm flex items-center justify-center [-webkit-tap-highlight-color:transparent] active:bg-[#e0e0e0] ${isWatched ? 'bg-[#e3f2fd]' : 'bg-[#f0f0f0]'}`}
          onClick={onToggleWatched}
          title={isWatched ? 'Mark unwatched' : 'Mark watched'}
        >
          {isWatched ? '👁' : '○'}
        </button>
        <button
          className={`w-8 h-8 border-none rounded-md cursor-pointer text-sm flex items-center justify-center [-webkit-tap-highlight-color:transparent] active:bg-[#e0e0e0] ${isWatchLater ? 'bg-[#e3f2fd]' : 'bg-[#f0f0f0]'}`}
          onClick={onToggleWatchLater}
          title={isWatchLater ? 'Remove from watch later' : 'Add to watch later'}
        >
          {isWatchLater ? '🔖' : '＋'}
        </button>
      </div>
    </div>
  );
}
