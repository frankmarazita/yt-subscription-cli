import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { EventsGateway } from '../events/events.gateway.js';
import type { VideoDto } from '@subs/contracts';

const parseStringPromise = promisify(parseString);

interface RssMediaThumbnail {
  $: { url: string };
}

interface RssMediaStatistics {
  $: { views: string };
}

interface RssMediaStarRating {
  $: { count: string };
}

interface RssMediaCommunity {
  'media:statistics'?: RssMediaStatistics[];
  'media:starRating'?: RssMediaStarRating[];
}

interface RssMediaGroup {
  'media:thumbnail'?: RssMediaThumbnail[];
  'media:description'?: string[];
  'media:community'?: RssMediaCommunity[];
}

interface RssEntry {
  'yt:videoId'?: string[];
  title: string[];
  published: string[];
  link: { $: { href: string } }[];
  author: { name: string[] }[];
  'media:group'?: RssMediaGroup[];
}

interface RssFeed {
  feed?: {
    entry?: RssEntry[];
  };
}

function toDto(video: {
  id: string;
  title: string;
  channel: string;
  link: string;
  published: bigint;
  isShort: boolean;
  thumbnailUrl: string | null;
  viewCount: number | null;
  likeCount: number | null;
  description: string | null;
}): VideoDto {
  return {
    videoId: video.id,
    title: video.title,
    channel: video.channel,
    link: video.link,
    published: new Date(Number(video.published)).toISOString(),
    isShort: video.isShort,
    thumbnailUrl: video.thumbnailUrl ?? undefined,
    viewCount: video.viewCount ?? undefined,
    likeCount: video.likeCount ?? undefined,
    description: video.description ?? undefined,
  };
}

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  private isRefreshing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly events: EventsGateway,
  ) {}

  async getVideos(includeShorts = false): Promise<VideoDto[]> {
    const videos = await this.prisma.video.findMany({
      where: includeShorts ? undefined : { isShort: false },
      orderBy: { published: 'desc' },
    });

    return videos.map(toDto);
  }

  async refreshVideos(includeShorts = false): Promise<VideoDto[]> {
    if (this.isRefreshing) {
      throw new ConflictException('Refresh already in progress');
    }

    this.isRefreshing = true;

    try {
      const subscriptions = await this.subscriptionsService.getAll();
      const results = await Promise.allSettled(
        subscriptions.map((sub) => this.fetchRSSFeed(sub.channelId)),
      );

      const allVideos: VideoDto[] = [];
      for (const [i, result] of results.entries()) {
        if (result.status === 'fulfilled') {
          allVideos.push(...result.value);
        } else {
          this.logger.warn(
            `Failed to fetch RSS for channel ${subscriptions[i]!.channelId}: ${result.reason}`,
          );
        }
      }

      if (allVideos.length > 0) {
        const now = BigInt(Date.now());
        await this.prisma.$transaction(
          allVideos.map((v) =>
            this.prisma.video.upsert({
              where: { id: v.videoId },
              create: {
                id: v.videoId,
                title: v.title,
                channel: v.channel,
                link: v.link,
                published: BigInt(new Date(v.published).getTime()),
                isShort: v.isShort,
                thumbnailUrl: v.thumbnailUrl ?? null,
                viewCount: v.viewCount ?? null,
                likeCount: v.likeCount ?? null,
                description: v.description ?? null,
                cachedAt: now,
              },
              update: {
                title: v.title,
                channel: v.channel,
                link: v.link,
                published: BigInt(new Date(v.published).getTime()),
                isShort: v.isShort,
                thumbnailUrl: v.thumbnailUrl ?? null,
                viewCount: v.viewCount ?? null,
                likeCount: v.likeCount ?? null,
                description: v.description ?? null,
                cachedAt: now,
              },
            }),
          ),
        );
      }

      await this.pruneStaleVideos();

      const videos = await this.prisma.video.findMany({
        where: includeShorts ? undefined : { isShort: false },
        orderBy: { published: 'desc' },
      });

      const result = videos.map(toDto);
      this.events.broadcast('videos');
      return result;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async pruneStaleVideos(): Promise<void> {
    const staleAt = BigInt(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [watchedRows, playlistRows] = await Promise.all([
      this.prisma.watchHistory.findMany({ select: { videoId: true } }),
      this.prisma.playlistVideo.findMany({ select: { videoId: true } }),
    ]);

    const protectedIds = [
      ...watchedRows.map((r) => r.videoId),
      ...playlistRows.map((r) => r.videoId),
    ];

    await this.prisma.video.deleteMany({
      where: {
        cachedAt: { lt: staleAt },
        id: { notIn: protectedIds },
      },
    });
  }

  private async fetchRSSFeed(channelId: string): Promise<VideoDto[]> {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const response = await fetch(rssUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from RSS feed`);
    }

    try {
      const xmlData = await response.text();
      const result = (await parseStringPromise(xmlData)) as RssFeed;

      const videos: VideoDto[] = [];
      const entries = result?.feed?.entry ?? [];

      for (const entry of entries) {
        const publishedDate = new Date(entry.published[0]);
        const link = entry.link[0].$.href;
        const isShort = link.includes('/shorts/');
        const videoId = entry['yt:videoId']?.[0];

        if (!videoId) continue;

        const mediaGroup = entry['media:group']?.[0];
        const thumbnails = mediaGroup?.['media:thumbnail'];
        const thumbnailUrl =
          thumbnails?.[thumbnails.length - 1]?.$.url ??
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

        const community = mediaGroup?.['media:community']?.[0];
        const viewsStr = community?.['media:statistics']?.[0]?.$.views;
        const likesStr = community?.['media:starRating']?.[0]?.$.count;

        videos.push({
          videoId,
          title: entry.title[0],
          channel: entry.author[0].name[0],
          link,
          published: publishedDate.toISOString(),
          isShort,
          thumbnailUrl,
          viewCount: viewsStr ? parseInt(viewsStr, 10) : undefined,
          likeCount: likesStr ? parseInt(likesStr, 10) : undefined,
          description: mediaGroup?.['media:description']?.[0],
        });
      }

      return videos;
    } catch (error) {
      this.logger.warn(
        `Failed to parse RSS feed for channel ${channelId}: ${error}`,
      );
      return [];
    }
  }
}
