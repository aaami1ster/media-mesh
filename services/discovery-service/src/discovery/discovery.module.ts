import { Module } from '@nestjs/common';
import { DiscoveryController } from './controllers/discovery.controller';
import { DiscoveryService } from './services/discovery.service';
import { DiscoveryRepository } from './repositories/discovery.repository';
import { DynamoDBDiscoveryRepository } from './repositories/dynamodb-discovery.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { DynamoDBModule } from '@mediamesh/shared';

@Module({
  imports: [PrismaModule, DynamoDBModule],
  controllers: [DiscoveryController],
  providers: [
    DiscoveryService,
    DiscoveryRepository,
    DynamoDBDiscoveryRepository,
  ],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
