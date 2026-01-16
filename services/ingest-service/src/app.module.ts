import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { IngestModule } from './ingest/ingest.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, KafkaModule, IngestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
