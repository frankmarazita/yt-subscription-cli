import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@subs/contracts';
import { VideosService } from './videos.service.js';

@Controller()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @TsRestHandler(contract.videos)
  async handler() {
    return tsRestHandler(contract.videos, {
      getVideos: async ({ query }) => {
        const videos = await this.videosService.getVideos(
          query.includeShorts ?? false,
        );
        return { status: 200 as const, body: videos };
      },
      refreshVideos: async ({ query }) => {
        const videos = await this.videosService.refreshVideos(
          query.includeShorts ?? false,
        );
        return { status: 200 as const, body: videos };
      },
    });
  }
}
