import { Module, Global } from '@nestjs/common';
import { KafkaService } from './kafka.service';

/**
 * Kafka Module
 * 
 * Global module that provides KafkaService to all modules.
 */
@Global()
@Module({
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
