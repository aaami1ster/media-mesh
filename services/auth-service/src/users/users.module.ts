import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { KafkaModule } from '../kafka/kafka.module';
import { KafkaService } from '../kafka/kafka.service';
import { AuthEventType } from '@mediamesh/shared';

/**
 * Users Module
 * 
 * Provides user management functionality.
 */
@Module({
  imports: [KafkaModule],
  providers: [UserRepository, UserService],
  exports: [UserRepository, UserService],
})
export class UsersModule {}
