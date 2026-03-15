interface Props {
  videoId: string;
  isShort?: boolean;
}

export function WatchScreen({ videoId, isShort }: Props) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <iframe
        className={isShort ? "h-full aspect-[9/16]" : "w-full h-full"}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
