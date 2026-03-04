import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SubscriptionDto } from '@subs/contracts';

function toDto(row: {
  channelId: string;
  title: string;
  channelUrl: string | null;
}): SubscriptionDto {
  return {
    channelId: row.channelId,
    title: row.title,
    channelUrl: row.channelUrl ?? undefined,
  };
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<SubscriptionDto[]> {
    const rows = await this.prisma.subscription.findMany({
      orderBy: { title: 'asc' },
    });
    return rows.map(toDto);
  }

  async add(url: string): Promise<SubscriptionDto> {
    const channelInfo = await this.extractChannelIdFromUrl(url);
    if (!channelInfo) {
      throw new UnprocessableEntityException(
        `Could not extract channel ID from URL: ${url}`,
      );
    }

    const { channelId, channelTitle } = channelInfo;

    const existing = await this.prisma.subscription.findUnique({
      where: { channelId },
    });
    if (existing) {
      throw new ConflictException(
        `Subscription for channel ${channelId} already exists`,
      );
    }

    const row = await this.prisma.subscription.create({
      data: {
        channelId,
        title: channelTitle,
        channelUrl: `https://www.youtube.com/channel/${channelId}`,
        createdAt: BigInt(Date.now()),
      },
    });

    return toDto(row);
  }

  async remove(channelId: string): Promise<void> {
    const result = await this.prisma.subscription.deleteMany({
      where: { channelId },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        `Subscription for channel ${channelId} not found`,
      );
    }
  }

  async exportToCsv(): Promise<string> {
    const rows = await this.prisma.subscription.findMany({
      orderBy: { title: 'asc' },
    });
    const lines = rows.map((r) => `${r.channelId},${r.channelUrl ?? ''},${r.title}`);
    return ['Channel ID,Channel URL,Channel title', ...lines].join('\n');
  }

  async importFromCsv(csv: string): Promise<SubscriptionDto[]> {
    const lines = csv.trim().split('\n');
    const subscriptions: {
      channelId: string;
      title: string;
      channelUrl: string | null;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line?.trim()) continue;

      const parts = line.split(',');
      const channelId = parts[0]?.trim();
      const channelUrl = parts[1]?.trim() || null;
      const title = parts[2]?.trim();

      if (channelId && title) {
        subscriptions.push({ channelId, title, channelUrl });
      }
    }

    const now = BigInt(Date.now());

    await this.prisma.$transaction([
      this.prisma.subscription.deleteMany(),
      ...subscriptions.map((s) =>
        this.prisma.subscription.create({
          data: {
            channelId: s.channelId,
            title: s.title,
            channelUrl: s.channelUrl,
            createdAt: now,
          },
        }),
      ),
    ]);

    return subscriptions.map(toDto);
  }

  private async extractChannelIdFromUrl(
    url: string,
  ): Promise<{ channelId: string; channelTitle: string } | null> {
    try {
      // Direct channel ID format
      const channelIdMatch = url.match(/youtube\.com\/channel\/([^\/\?&]+)/);
      if (channelIdMatch && channelIdMatch[1]) {
        const channelId = channelIdMatch[1];
        const channelTitle = await this.getChannelTitle(channelId);
        return channelTitle ? { channelId, channelTitle } : null;
      }

      // Handle @username and /c/username formats by fetching the page
      const usernameMatch = url.match(
        /youtube\.com\/(@[^\/\?&]+|c\/[^\/\?&]+)/,
      );
      if (usernameMatch) {
        return await this.resolveChannelFromUsername(url);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async getChannelTitle(channelId: string): Promise<string | null> {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const response = await fetch(rssUrl, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) return null;

      const xmlData = await response.text();
      const titleMatch = xmlData.match(/<title>([^<]+)<\/title>/);

      if (titleMatch && titleMatch[1]) {
        // Remove " - YouTube" suffix if present
        return titleMatch[1].replace(/ - YouTube$/, '');
      }

      return null;
    } catch {
      return null;
    }
  }

  private async resolveChannelFromUsername(
    url: string,
  ): Promise<{ channelId: string; channelTitle: string } | null> {
    try {
      // Fetch the YouTube page to extract the channel ID with proper headers
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (!response.ok) return null;

      const html = await response.text();

      // Try multiple patterns for channel ID extraction (prioritize more reliable sources)
      // First try canonical URL (most reliable)
      let channelIdMatch = html.match(
        /<link[^>]*rel="canonical"[^>]*href="[^"]*\/channel\/([^"\/]+)"/,
      );

      if (!channelIdMatch) {
        // Try og:url meta tag
        channelIdMatch = html.match(
          /<meta[^>]*property="og:url"[^>]*content="[^"]*\/channel\/([^"\/]+)"/,
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
        const channelTitle = await this.getChannelTitle(channelId);
        return channelTitle ? { channelId, channelTitle } : null;
      }

      return null;
    } catch {
      return null;
    }
  }
}
