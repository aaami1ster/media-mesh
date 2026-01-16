import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Program } from './program.model';
import { Episode } from './episode.model';

/**
 * Search Result GraphQL Model
 */
@ObjectType()
export class SearchResult {
  @Field(() => [Program])
  programs: Program[];

  @Field(() => [Episode])
  episodes: Episode[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
