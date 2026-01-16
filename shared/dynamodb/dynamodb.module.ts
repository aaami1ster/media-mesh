import { Module, Global } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';

/**
 * DynamoDB Module
 * 
 * Provides DynamoDB service for use across microservices.
 * Configured as a global module for easy access.
 */
@Global()
@Module({
  providers: [DynamoDBService],
  exports: [DynamoDBService],
})
export class DynamoDBModule {}
