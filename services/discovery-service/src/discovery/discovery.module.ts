import { Module } from '@nestjs/common';
import { DiscoveryController } from './controllers/discovery.controller';
import { DiscoveryService } from './services/discovery.service';
import { DiscoveryRepository } from './repositories/discovery.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, DiscoveryRepository],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
