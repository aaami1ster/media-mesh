import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [DiscoveryModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
