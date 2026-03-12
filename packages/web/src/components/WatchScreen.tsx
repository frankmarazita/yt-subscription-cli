import { ArrowLeft } from "lucide-react";

interface Props {
  videoId: string;
  isShort?: boolean;
  onClose: () => void;
}

export function WatchScreen({ videoId, isShort, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="flex items-center px-3 py-2 bg-black/80">
        <button
          className="text-white p-1 [-webkit-tap-highlight-color:transparent]"
          onClick={onClose}
        >
          <ArrowLeft size={22} />
        </button>
      </div>
      <div
        className={`flex flex-1 items-center justify-center ${isShort ? "" : "w-full"}`}
      >
        <iframe
          className={isShort ? "h-full aspect-[9/16]" : "w-full h-full"}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
