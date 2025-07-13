import type { VideoItem } from '../types.js';

export interface VideoGroup {
  label: string;
  videos: VideoItem[];
  daysBetween: number;
}

export function groupVideosByDays(videos: VideoItem[]): VideoGroup[] {
  const now = new Date();
  const groups = new Map<string, VideoItem[]>();

  // Sort videos by published date, newest first
  const sortedVideos = [...videos].sort((a, b) => b.published.getTime() - a.published.getTime());

  for (const video of sortedVideos) {
    const videoDate = video.published;
    const diffDays = Math.floor((now.getTime() - videoDate.getTime()) / (1000 * 3600 * 24));
    let groupLabel: string;

    if (diffDays === 0) {
      groupLabel = '📅 Last 24 hours';
    } else if (diffDays === 1) {
      groupLabel = '📅 Yesterday';
    } else if (diffDays <= 7) {
      groupLabel = `📅 ${diffDays} days ago`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      groupLabel = weeks === 1 ? '📅 1 week ago' : `📅 ${weeks} weeks ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      groupLabel = months === 1 ? '📅 1 month ago' : `📅 ${months} months ago`;
    }
    
    if (!groups.has(groupLabel)) {
      groups.set(groupLabel, []);
    }
    groups.get(groupLabel)!.push(video);
  }

  return Array.from(groups.entries()).map(([label, videos]) => ({
    label,
    videos,
    daysBetween: Math.floor((now.getTime() - videos[0].published.getTime()) / (1000 * 3600 * 24)),
  }));
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  
  const days = Math.floor(diffInMinutes / 1440);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;
  
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

// Simple hash function to generate a color from a string
export function getChannelColor(channelName: string): string {
  let hash = 0;
  for (let i = 0; i < channelName.length; i++) {
    hash = channelName.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    // Ensure a minimum brightness by adding an offset
    const lightValue = Math.min(255, value + 100); // Add 100 to make it lighter, cap at 255
    color += ('00' + lightValue.toString(16)).substr(-2);
  }
  return color;
}