import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MetadataModule } from './metadata/metadata.module';

@Module({
  imports: [PrismaModule, MetadataModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
