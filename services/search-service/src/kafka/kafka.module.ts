import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [SearchModule],
  providers: [KafkaConsumerService],
  exports: [KafkaConsumerService],
})
export class KafkaModule {}
