import { useRef } from "react";
import { Eye, EyeOff, Check, Bookmark, BookmarkPlus } from "lucide-react";
import type { VideoItem } from "../types";

interface Props {
  video: VideoItem;
  isWatched: boolean;
  isWatchLater: boolean;
  onToggleWatched: () => void;
  onToggleWatchLater: () => void;
  onWatch: (video: VideoItem) => void;
}

const SWIPE_THRESHOLD = 72;
const SWIPE_DEAD_ZONE = 16;

export function VideoCard({
  video,
  isWatched,
  isWatchLater,
  onToggleWatched,
  onToggleWatchLater,
  onWatch,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const leftHintRef = useRef<HTMLDivElement>(null);
  const rightHintRef = useRef<HTMLDivElement>(null);

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isHorizontal = false;

  function onTouchStart(e: React.TouchEvent) {
    startX = e.touches[0]!.clientX;
    startY = e.touches[0]!.clientY;
    currentX = startX;
    currentY = startY;
    isHorizontal = false;
    if (cardRef.current) cardRef.current.style.transition = "none";
  }

  function onTouchMove(e: React.TouchEvent) {
    currentX = e.touches[0]!.clientX;
    currentY = e.touches[0]!.clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    if (
      !isHorizontal &&
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > 6
    ) {
      isHorizontal = true;
    }

    if (!isHorizontal) return;

    const sign = deltaX > 0 ? 1 : -1;
    const absDelta = Math.abs(deltaX);
    const visualDelta =
      absDelta < SWIPE_DEAD_ZONE ? 0 : sign * (absDelta - SWIPE_DEAD_ZONE);

    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${visualDelta}px)`;
    }

    const progress = Math.min(absDelta / SWIPE_THRESHOLD, 1);

    if (deltaX > 0 && leftHintRef.current) {
      leftHintRef.current.style.opacity = String(progress);
      if (rightHintRef.current) rightHintRef.current.style.opacity = "0";
    } else if (deltaX < 0 && rightHintRef.current) {
      rightHintRef.current.style.opacity = String(progress);
      if (leftHintRef.current) leftHintRef.current.style.opacity = "0";
    }
  }

  function snapBack() {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.25s ease-out";
      cardRef.current.style.transform = "translateX(0)";
    }
    if (leftHintRef.current) leftHintRef.current.style.opacity = "0";
    if (rightHintRef.current) rightHintRef.current.style.opacity = "0";
  }

  function onTouchEnd() {
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    if (!isHorizontal || Math.abs(deltaY) > Math.abs(deltaX)) {
      snapBack();
      return;
    }

    if (deltaX > SWIPE_THRESHOLD) {
      onToggleWatched();
    } else if (deltaX < -SWIPE_THRESHOLD) {
      onToggleWatchLater();
    }

    snapBack();
  }

  function openVideo() {
    if (!isWatched) onToggleWatched();
    onWatch(video);
  }

  return (
    <div className="relative overflow-hidden border-b border-[#e0e0e0]">
      <div
        ref={leftHintRef}
        className="absolute inset-0 bg-green-600 flex items-center pl-5 opacity-0 pointer-events-none"
      >
        <Eye size={22} className="text-white" />
      </div>
      <div
        ref={rightHintRef}
        className="absolute inset-0 bg-blue-500 flex items-center justify-end pr-5 opacity-0 pointer-events-none"
      >
        <BookmarkPlus size={22} className="text-white" />
      </div>
      <div
        ref={cardRef}
        className={`flex items-start gap-3 p-3 cursor-pointer select-none touch-pan-y [-webkit-tap-highlight-color:transparent] active:bg-[#f5f5f5] ${isWatched ? "bg-[#fafafa]" : "bg-white"}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={openVideo}
      >
        <div className="relative flex-shrink-0 w-[120px] h-[68px] rounded overflow-hidden bg-[#e0e0e0]">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#d0d0d0]" />
          )}
          {isWatched && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white">
              <Check size={22} strokeWidth={3} />
            </div>
          )}
          {isWatchLater && (
            <div className="absolute top-1 right-1 text-white drop-shadow">
              <Bookmark size={14} fill="currentColor" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div
            className={`text-sm font-semibold leading-[1.4] line-clamp-2 ${isWatched ? "text-[#999]" : "text-[#111]"}`}
          >
            {video.title}
          </div>
          <div className="text-xs text-[#555] truncate">{video.channel}</div>
          <div className="text-[11px] text-[#999]">
            {video.publishedFormatted}
          </div>
        </div>
        <div
          className="flex flex-col gap-1.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={`w-8 h-8 border-none rounded-md cursor-pointer flex items-center justify-center [-webkit-tap-highlight-color:transparent] active:bg-[#e0e0e0] ${isWatched ? "bg-green-100 text-green-700" : "bg-[#f0f0f0] text-[#555]"}`}
            onClick={onToggleWatched}
            title={isWatched ? "Mark unwatched" : "Mark watched"}
          >
            {isWatched ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button
            className={`w-8 h-8 border-none rounded-md cursor-pointer flex items-center justify-center [-webkit-tap-highlight-color:transparent] active:bg-[#e0e0e0] ${isWatchLater ? "bg-blue-100 text-blue-500" : "bg-[#f0f0f0] text-[#555]"}`}
            onClick={onToggleWatchLater}
            title={
              isWatchLater ? "Remove from watch later" : "Add to watch later"
            }
          >
            {isWatchLater ? (
              <Bookmark size={15} fill="currentColor" />
            ) : (
              <BookmarkPlus size={15} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
