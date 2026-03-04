import { Module } from '@nestjs/common';
import { WatchLaterService } from './watch-later.service.js';
import { WatchLaterController } from './watch-later.controller.js';
import { EventsModule } from '../events/events.module.js';

@Module({
  imports: [EventsModule],
  controllers: [WatchLaterController],
  providers: [WatchLaterService],
})
export class WatchLaterModule {}
