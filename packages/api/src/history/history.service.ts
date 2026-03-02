import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getIds(): Promise<string[]> {
    const rows = await this.prisma.watchHistory.findMany({
      select: { videoId: true },
    });
    return rows.map((r) => r.videoId);
  }

  async markWatched(videoId: string): Promise<void> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) {
      throw new NotFoundException(
        `Video ${videoId} not found. Refresh videos first.`,
      );
    }
    await this.prisma.watchHistory.upsert({
      where: { videoId },
      create: { videoId, watchedAt: BigInt(Date.now()) },
      update: {},
    });
  }

  async markUnwatched(videoId: string): Promise<void> {
    await this.prisma.watchHistory.deleteMany({ where: { videoId } });
  }
}
