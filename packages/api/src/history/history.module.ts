import { Module } from '@nestjs/common';
import { HistoryService } from './history.service.js';
import { HistoryController } from './history.controller.js';
import { EventsModule } from '../events/events.module.js';

@Module({
  imports: [EventsModule],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
