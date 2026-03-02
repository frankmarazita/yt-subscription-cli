import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@subs/contracts';
import { WatchLaterService } from './watch-later.service.js';

@Controller()
export class WatchLaterController {
  constructor(private readonly watchLaterService: WatchLaterService) {}

  @TsRestHandler(contract.watchLater.getIds)
  async getIds() {
    return tsRestHandler(contract.watchLater.getIds, async () => {
      const ids = await this.watchLaterService.getIds();
      return { status: 200 as const, body: { ids } };
    });
  }

  @TsRestHandler(contract.watchLater.add)
  async add() {
    return tsRestHandler(contract.watchLater.add, async ({ params }) => {
      await this.watchLaterService.add(params.videoId);
      return { status: 204 as const, body: undefined };
    });
  }

  @TsRestHandler(contract.watchLater.remove)
  async remove() {
    return tsRestHandler(contract.watchLater.remove, async ({ params }) => {
      await this.watchLaterService.remove(params.videoId);
      return { status: 204 as const, body: undefined };
    });
  }
}
