import {
  Controller,
  Get,
  Header,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@subs/contracts';
import { SubscriptionsService } from './subscriptions.service.js';

@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @TsRestHandler(contract.subscriptions.getAll)
  async getAll() {
    return tsRestHandler(contract.subscriptions.getAll, async () => {
      const subscriptions = await this.subscriptionsService.getAll();
      return { status: 200 as const, body: subscriptions };
    });
  }

  @TsRestHandler(contract.subscriptions.add)
  async add() {
    return tsRestHandler(contract.subscriptions.add, async ({ body }) => {
      const subscription = await this.subscriptionsService.add(body.url);
      return { status: 201 as const, body: subscription };
    });
  }

  @TsRestHandler(contract.subscriptions.remove)
  async remove() {
    return tsRestHandler(contract.subscriptions.remove, async ({ params }) => {
      await this.subscriptionsService.remove(params.channelId);
      return { status: 204 as const, body: undefined };
    });
  }

  @Get('/subscriptions/export-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="subscriptions.csv"')
  async exportCsv() {
    return this.subscriptionsService.exportToCsv();
  }

  @Post('/subscriptions/import-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    const csv = file.buffer.toString('utf-8');
    return this.subscriptionsService.importFromCsv(csv);
  }
}
