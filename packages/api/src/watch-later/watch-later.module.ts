import { Module } from '@nestjs/common';
import { WatchLaterService } from './watch-later.service.js';
import { WatchLaterController } from './watch-later.controller.js';

@Module({
  controllers: [WatchLaterController],
  providers: [WatchLaterService],
})
export class WatchLaterModule {}
