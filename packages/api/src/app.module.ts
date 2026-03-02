import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { VideosModule } from './videos/videos.module.js';
import { WatchLaterModule } from './watch-later/watch-later.module.js';
import { HistoryModule } from './history/history.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';

@Module({
  imports: [
    PrismaModule,
    VideosModule,
    WatchLaterModule,
    HistoryModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
