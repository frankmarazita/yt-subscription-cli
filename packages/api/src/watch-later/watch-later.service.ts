import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../events/events.gateway.js';

const WATCH_LATER_PLAYLIST_ID = 'watch_later';

@Injectable()
export class WatchLaterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  async getIds(): Promise<string[]> {
    const rows = await this.prisma.playlistVideo.findMany({
      where: { playlistId: WATCH_LATER_PLAYLIST_ID },
      select: { videoId: true },
    });
    return rows.map((r) => r.videoId);
  }

  async add(videoId: string): Promise<void> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) {
      throw new NotFoundException(
        `Video ${videoId} not found. Refresh videos first.`,
      );
    }
    await this.ensurePlaylistExists();
    await this.prisma.playlistVideo.upsert({
      where: {
        playlistId_videoId: { playlistId: WATCH_LATER_PLAYLIST_ID, videoId },
      },
      create: {
        playlistId: WATCH_LATER_PLAYLIST_ID,
        videoId,
        addedAt: BigInt(Date.now()),
        orderIndex: null,
      },
      update: {},
    });
    this.events.broadcast('watchLater');
  }

  async remove(videoId: string): Promise<void> {
    await this.prisma.playlistVideo.deleteMany({
      where: { playlistId: WATCH_LATER_PLAYLIST_ID, videoId },
    });
    this.events.broadcast('watchLater');
  }

  private async ensurePlaylistExists(): Promise<void> {
    const now = BigInt(Date.now());
    await this.prisma.playlist.upsert({
      where: { id: WATCH_LATER_PLAYLIST_ID },
      create: {
        id: WATCH_LATER_PLAYLIST_ID,
        name: 'Watch Later',
        createdAt: now,
        updatedAt: now,
      },
      update: {},
    });
  }
}
