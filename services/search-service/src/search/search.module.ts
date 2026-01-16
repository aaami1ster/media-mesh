import { Module } from '@nestjs/common';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { SearchRepository } from './repositories/search.repository';
import { DynamoDBSearchRepository } from './repositories/dynamodb-search.repository';
import { DynamoDBModule } from '@mediamesh/shared';

/**
 * Search Module
 * 
 * Module for search and indexing functionality.
 */
@Module({
  imports: [DynamoDBModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository, DynamoDBSearchRepository],
  exports: [SearchService],
})
export class SearchModule {}
