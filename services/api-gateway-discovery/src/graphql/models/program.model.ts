import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ContentStatus, ContentType } from '@mediamesh/shared';

/**
 * Program GraphQL Model
 */
@ObjectType()
export class Program {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => String)
  status: ContentStatus;

  @Field(() => String, { nullable: true })
  contentType?: ContentType;

  @Field({ nullable: true })
  metadataId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  publishedAt?: Date;
}
