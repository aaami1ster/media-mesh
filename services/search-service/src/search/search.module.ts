import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { SearchRepository } from './repositories/search.repository';
import { DynamoDBSearchRepository } from './repositories/dynamodb-search.repository';
import { DynamoDBModule } from '@mediamesh/shared';
import { JWT_CONFIG } from '../config/env.constants';

/**
 * Search Module
 * 
 * Module for search and indexing functionality.
 */
@Module({
  imports: [
    DynamoDBModule,
    JwtModule.register({
      secret: JWT_CONFIG.SECRET,
      signOptions: {
        expiresIn: JWT_CONFIG.EXPIRATION_STRING,
      },
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository, DynamoDBSearchRepository],
  exports: [SearchService],
})
export class SearchModule {}
