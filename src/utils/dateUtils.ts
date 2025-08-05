import type { VideoItem } from "../types";
import { format, register } from "timeago.js";

// Register a custom short locale
const shortLocale = (number: number, index: number): [string, string] => {
  return [
    ['just now', 'right now'],
    ['%ss', 'in %ss'],
    ['1m', 'in 1m'],
    ['%sm', 'in %sm'],
    ['1h', 'in 1h'],
    ['%sh', 'in %sh'],
    ['1d', 'in 1d'],
    ['%sd', 'in %sd'],
    ['1w', 'in 1w'],
    ['%sw', 'in %sw'],
    ['1mo', 'in 1mo'],
    ['%smo', 'in %smo'],
    ['1y', 'in 1y'],
    ['%sy', 'in %sy']
  ][index] as [string, string];
};

register('short', shortLocale);

export function formatTimeAgo(date: Date): string {
  const shortTime = format(date, 'short');
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  
  return `${dayOfWeek} ${day} ${month} (${shortTime})`;
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
