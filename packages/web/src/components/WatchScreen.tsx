import { ArrowLeft } from "lucide-react";
import type { VideoItem } from "../types";

interface Props {
  video: VideoItem;
  onClose: () => void;
}

function getEmbedId(video: VideoItem): string {
  if (video.isShort) {
    const match = video.link.match(/\/shorts\/([^/?]+)/);
    if (match?.[1]) return match[1];
  }
  const v = new URL(video.link).searchParams.get("v");
  if (v) return v;
  return video.videoId;
}

export function WatchScreen({ video, onClose }: Props) {
  const embedId = getEmbedId(video);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center px-3 py-2 bg-black/80">
        <button
          className="text-white p-1 [-webkit-tap-highlight-color:transparent]"
          onClick={onClose}
        >
          <ArrowLeft size={22} />
        </button>
      </div>
      <div
        className={`flex flex-1 items-center justify-center ${video.isShort ? "" : "w-full"}`}
      >
        <iframe
          className={video.isShort ? "h-full aspect-[9/16]" : "w-full h-full"}
          src={`https://www.youtube.com/embed/${embedId}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
