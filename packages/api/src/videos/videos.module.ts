import { Module } from '@nestjs/common';
import { VideosService } from './videos.service.js';
import { VideosController } from './videos.controller.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [SubscriptionsModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
