import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { ProxyService } from '../../proxy/proxy.service';
import { Program } from '../models/program.model';
import { Episode } from '../models/episode.model';
import { SearchResult } from '../models/search-result.model';
import { SearchArgs, ProgramsArgs, TrendingArgs } from '../dto/search-args.dto';
import { Logger } from '@nestjs/common';

/**
 * Discovery GraphQL Resolver
 * 
 * Provides GraphQL queries for content discovery.
 */
@Resolver()
export class DiscoveryResolver {
  private readonly logger = new Logger(DiscoveryResolver.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Query: programs
   * Get a paginated list of programs
   */
  @Query(() => [Program], { name: 'programs' })
  async getPrograms(
    @Args() args: ProgramsArgs,
    @Context() context: any,
  ): Promise<Program[]> {
    this.logger.debug(`GraphQL query: programs with args: ${JSON.stringify(args)}`);

    const query: any = {};
    if (args.page) query.page = args.page;
    if (args.limit) query.limit = args.limit;

    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/discovery/programs?${queryString}` : '/discovery/programs';

    const headers = this.getAuthHeaders(context.req);
    const result = await this.proxyService.proxyToDiscovery('GET', path, null, headers);

    return Array.isArray(result) ? result : result.data || [];
  }

  /**
   * Query: program
   * Get a specific program by ID
   */
  @Query(() => Program, { name: 'program', nullable: true })
  async getProgram(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<Program | null> {
    this.logger.debug(`GraphQL query: program with id: ${id}`);

    const headers = this.getAuthHeaders(context.req);
    const result = await this.proxyService.proxyToDiscovery(
      'GET',
      `/discovery/programs/${id}`,
      null,
      headers,
    );

    return result || null;
  }

  /**
   * Query: episodes
   * Get episodes for a program
   */
  @Query(() => [Episode], { name: 'episodes' })
  async getEpisodes(
    @Args('programId') programId: string,
    @Context() context: any,
  ): Promise<Episode[]> {
    this.logger.debug(`GraphQL query: episodes for programId: ${programId}`);

    const headers = this.getAuthHeaders(context.req);
    const result = await this.proxyService.proxyToDiscovery(
      'GET',
      `/discovery/programs/${programId}/episodes`,
      null,
      headers,
    );

    return Array.isArray(result) ? result : result.data || [];
  }

  /**
   * Query: search
   * Search for content
   */
  @Query(() => SearchResult, { name: 'search' })
  async search(
    @Args() args: SearchArgs,
    @Context() context: any,
  ): Promise<SearchResult> {
    this.logger.debug(`GraphQL query: search with args: ${JSON.stringify(args)}`);

    const query: any = { q: args.q };
    if (args.contentType) query.contentType = args.contentType;
    if (args.category) query.category = args.category;
    if (args.language) query.language = args.language;
    if (args.tags) query.tags = args.tags.join(',');
    if (args.page) query.page = args.page;
    if (args.limit) query.limit = args.limit;

    const queryString = new URLSearchParams(query).toString();
    const path = `/search?${queryString}`;

    const headers = this.getAuthHeaders(context.req);
    const result = await this.proxyService.proxyToSearch('GET', path, null, headers);

    // Transform result to match GraphQL schema
    // Search service returns { results: [...], total, page, limit }
    const programs = (result.results || []).filter(
      (r: any) => r.contentType === 'PROGRAM' || !r.contentType,
    );
    const episodes = (result.results || []).filter(
      (r: any) => r.contentType === 'EPISODE',
    );

    return {
      programs,
      episodes,
      total: result.total || 0,
      page: result.page || args.page || 1,
      limit: result.limit || args.limit || 20,
    };
  }

  /**
   * Query: trending
   * Get trending content
   */
  @Query(() => [Program], { name: 'trending' })
  async getTrending(
    @Args() args: TrendingArgs,
    @Context() context: any,
  ): Promise<Program[]> {
    this.logger.debug(`GraphQL query: trending with limit: ${args.limit}`);

    const query: any = {};
    if (args.limit) query.limit = args.limit;

    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/discovery/trending?${queryString}` : '/discovery/trending';

    const headers = this.getAuthHeaders(context.req);
    const result = await this.proxyService.proxyToDiscovery('GET', path, null, headers);

    return Array.isArray(result) ? result : result.data || [];
  }

  /**
   * Query: popular
   * Get popular content
   */
  @Query(() => [Program], { name: 'popular' })
  async getPopular(
    @Args() args: TrendingArgs,
    @Context() context: any,
  ): Promise<Program[]> {
    this.logger.debug(`GraphQL query: popular with limit: ${args.limit}`);

    const query: any = {};
    if (args.limit) query.limit = args.limit;

    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/discovery/popular?${queryString}` : '/discovery/popular';

    const headers = this.getAuthHeaders(context.req);
    const result = await this.proxyService.proxyToDiscovery('GET', path, null, headers);

    return Array.isArray(result) ? result : result.data || [];
  }

  private getAuthHeaders(req: any): Record<string, string> {
    const headers: Record<string, string> = {};
    if (req?.headers?.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    return headers;
  }
}
