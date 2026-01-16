import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ContentStatus } from '@mediamesh/shared';

/**
 * Episode GraphQL Model
 */
@ObjectType()
export class Episode {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  programId: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  episodeNumber: number;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field(() => String)
  status: ContentStatus;

  @Field({ nullable: true })
  metadataId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
