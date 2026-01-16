import { ArgsType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ContentType } from '@mediamesh/shared';

// Register enum for GraphQL
registerEnumType(ContentType, {
  name: 'ContentType',
});

/**
 * Search Arguments for GraphQL
 */
@ArgsType()
export class SearchArgs {
  @Field()
  @IsString()
  q: string;

  @Field(() => ContentType, { nullable: true })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  tags?: string[];

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Programs Query Arguments
 */
@ArgsType()
export class ProgramsArgs {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Trending/Popular Arguments
 */
@ArgsType()
export class TrendingArgs {
  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
