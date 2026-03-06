import terminalImage from "terminal-image";

export function calculateTargetWidth(availableWidth: number): number {
  if (availableWidth < 30) {
    return Math.max(16, availableWidth - 1);
  } else if (availableWidth < 45) {
    return Math.max(24, availableWidth - 2);
  } else if (availableWidth < 70) {
    return Math.max(35, availableWidth - 3);
  } else {
    return Math.max(50, Math.min(availableWidth - 4, 80));
  }
}

export async function renderTerminalImage(
  buffer: Uint8Array,
  width: number
): Promise<string> {
  const saved = {
    KONSOLE_VERSION: process.env.KONSOLE_VERSION,
    TERM_PROGRAM: process.env.TERM_PROGRAM,
  };
  process.env.KONSOLE_VERSION = "";
  process.env.TERM_PROGRAM = "";
  try {
    return await terminalImage.buffer(buffer, {
      width,
      preserveAspectRatio: true,
    });
  } finally {
    if (saved.KONSOLE_VERSION !== undefined)
      process.env.KONSOLE_VERSION = saved.KONSOLE_VERSION;
    if (saved.TERM_PROGRAM !== undefined)
      process.env.TERM_PROGRAM = saved.TERM_PROGRAM;
  }
}

export async function fetchAndRenderThumbnail(
  thumbnailUrl: string,
  targetWidth: number,
  signal?: AbortSignal
): Promise<string | null> {
  const response = await fetch(thumbnailUrl, { signal: signal as any });
  if (!response.ok) return null;
  const arrayBuffer = await response.arrayBuffer();
  if (signal?.aborted) return null;
  const uint8Array = new Uint8Array(arrayBuffer);
  const image = await renderTerminalImage(uint8Array, targetWidth);
  if (signal?.aborted) return null;
  return image || null;
}

export function buildCacheKey(
  videoId: string,
  width: number,
  height: number
): string {
  return `${videoId}-${width}x${height}`;
}
