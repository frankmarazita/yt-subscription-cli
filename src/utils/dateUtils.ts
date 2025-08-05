import type { VideoItem } from "../types";
import { format } from 'timeago.js';



export function formatTimeAgo(date: Date): string {
  return format(date);
}

// Simple hash function to generate a color from a string
export function getChannelColor(channelName: string): string {
  let hash = 0;
  for (let i = 0; i < channelName.length; i++) {
    hash = channelName.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    // Ensure a minimum brightness by adding an offset
    const lightValue = Math.min(255, value + 100); // Add 100 to make it lighter, cap at 255
    color += ("00" + lightValue.toString(16)).substr(-2);
  }
  return color;
}
