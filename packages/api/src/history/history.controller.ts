import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@subs/contracts';
import { HistoryService } from './history.service.js';

@Controller()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @TsRestHandler(contract.history.getIds)
  async getIds() {
    return tsRestHandler(contract.history.getIds, async () => {
      const ids = await this.historyService.getIds();
      return { status: 200 as const, body: { ids } };
    });
  }

  @TsRestHandler(contract.history.markWatched)
  async markWatched() {
    return tsRestHandler(contract.history.markWatched, async ({ params }) => {
      await this.historyService.markWatched(params.videoId);
      return { status: 204 as const, body: undefined };
    });
  }

  @TsRestHandler(contract.history.markUnwatched)
  async markUnwatched() {
    return tsRestHandler(contract.history.markUnwatched, async ({ params }) => {
      await this.historyService.markUnwatched(params.videoId);
      return { status: 204 as const, body: undefined };
    });
  }
}
