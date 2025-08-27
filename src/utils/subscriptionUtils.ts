import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export async function addSubscriptionToCSV(url: string): Promise<string> {
  const result = await extractChannelIdFromUrl(url);

  if (!result) {
    throw new Error("Could not extract channel information from URL");
  }

  const { channelId, channelTitle } = result;

  // Get the subscriptions.csv path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const subscriptionsPath = join(__dirname, "..", "..", "subscriptions.csv");

  try {
    // Read existing CSV
    const data = await readFile(subscriptionsPath, "utf-8");
    const lines = data.trim().split("\n");

    // Check if channel already exists
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.startsWith(channelId + ",")) {
        throw new Error(`Channel "${channelTitle}" is already subscribed`);
      }
    }

    // Append new subscription (format: channelId,channelUrl,channelTitle)
    const newLine = `${channelId},https://www.youtube.com/channel/${channelId},${channelTitle}`;
    const updatedData = data + "\n" + newLine;

    await writeFile(subscriptionsPath, updatedData);
    return `Successfully added subscription: ${channelTitle}`;
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      // Create new CSV file
      const header = "Channel Id,Channel Url,Channel Title";
      const newLine = `${channelId},https://www.youtube.com/channel/${channelId},${channelTitle}`;
      const csvData = header + "\n" + newLine;

      await writeFile(subscriptionsPath, csvData);
      return `Created subscriptions.csv and added: ${channelTitle}`;
    }
    throw error;
  }
}

async function extractChannelIdFromUrl(
  url: string
): Promise<{ channelId: string; channelTitle: string } | null> {
  try {
    // Direct channel ID format
    const channelIdMatch = url.match(/youtube\.com\/channel\/([^\/\?&]+)/);
    if (channelIdMatch && channelIdMatch[1]) {
      const channelId = channelIdMatch[1];
      const channelTitle = await getChannelTitle(channelId);
      return channelTitle ? { channelId, channelTitle } : null;
    }

    // Handle @username and /c/username formats by fetching the page
    const usernameMatch = url.match(/youtube\.com\/(@[^\/\?&]+|c\/[^\/\?&]+)/);
    if (usernameMatch) {
      return await resolveChannelFromUsername(url);
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function getChannelTitle(channelId: string): Promise<string | null> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl);

    if (!response.ok) return null;

    const xmlData = await response.text();
    const titleMatch = xmlData.match(/<title>([^<]+)<\/title>/);

    if (titleMatch && titleMatch[1]) {
      // Remove " - YouTube" suffix if present
      return titleMatch[1].replace(/ - YouTube$/, "");
    }

    return null;
  } catch {
    return null;
  }
}

async function resolveChannelFromUsername(
  url: string
): Promise<{ channelId: string; channelTitle: string } | null> {
  try {
    // Fetch the YouTube page to extract the channel ID with proper headers
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try multiple patterns for channel ID extraction (prioritize more reliable sources)
    // First try canonical URL (most reliable)
    let channelIdMatch = html.match(
      /<link[^>]*rel="canonical"[^>]*href="[^"]*\/channel\/([^"\/]+)"/
    );

    if (!channelIdMatch) {
      // Try og:url meta tag
      channelIdMatch = html.match(
        /<meta[^>]*property="og:url"[^>]*content="[^"]*\/channel\/([^"\/]+)"/
      );
    }

    if (!channelIdMatch) {
      // Fallback to general channel/ pattern
      channelIdMatch = html.match(/channel\/([a-zA-Z0-9_-]{24})/);
    }

    if (!channelIdMatch) {
      // Last resort: channelId JSON pattern (less reliable due to multiple matches)
      channelIdMatch = html.match(/"channelId":"([^"]+)"/);
    }

    if (channelIdMatch && channelIdMatch[1]) {
      const channelId = channelIdMatch[1];
      const channelTitle = await getChannelTitle(channelId);
      return channelTitle ? { channelId, channelTitle } : null;
    }

    return null;
  } catch {
    return null;
  }
}
