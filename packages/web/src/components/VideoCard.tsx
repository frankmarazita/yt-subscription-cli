import type { VideoItem } from '../types';
import styles from './VideoCard.module.css';

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
      className={`${styles.card} ${isWatched ? styles.watched : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={openVideo}
    >
      <div className={styles.thumbnail}>
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} />
        ) : (
          <div className={styles.thumbnailPlaceholder} />
        )}
        {isWatched && <div className={styles.watchedOverlay}>✓</div>}
        {isWatchLater && <div className={styles.watchLaterBadge}>🔖</div>}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{video.title}</div>
        <div className={styles.channel}>{video.channel}</div>
        <div className={styles.date}>{video.publishedFormatted}</div>
      </div>
      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        <button
          className={`${styles.actionBtn} ${isWatched ? styles.actionActive : ''}`}
          onClick={onToggleWatched}
          title={isWatched ? 'Mark unwatched' : 'Mark watched'}
        >
          {isWatched ? '👁' : '○'}
        </button>
        <button
          className={`${styles.actionBtn} ${isWatchLater ? styles.actionActive : ''}`}
          onClick={onToggleWatchLater}
          title={isWatchLater ? 'Remove from watch later' : 'Add to watch later'}
        >
          {isWatchLater ? '🔖' : '＋'}
        </button>
      </div>
    </div>
  );
}
