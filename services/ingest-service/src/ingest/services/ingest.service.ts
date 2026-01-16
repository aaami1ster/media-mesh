import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IngestRepository } from '../repositories/ingest.repository';
import { IngestJob, SourceType, IngestStatus } from '../entities/ingest-job.entity';
import { YouTubeParser } from '../parsers/youtube.parser';
import { RSSParser } from '../parsers/rss.parser';
import { APIParser } from '../parsers/api.parser';
import { KafkaService } from '../../kafka/kafka.service';
import { throwIfNotFound } from '@mediamesh/shared';
import { INGEST_CONFIG } from '../../config/env.constants';
import { ContentType } from '@mediamesh/shared';

/**
 * Normalized content structure
 */
interface NormalizedContent {
  title: string;
  description?: string;
  contentType: ContentType;
  metadata?: Record<string, any>;
  episodes?: Array<{
    title: string;
    description?: string;
    episodeNumber?: number;
    duration?: number;
    url?: string;
    thumbnailUrl?: string;
    publishedAt?: Date;
  }>;
}

/**
 * Ingest Service
 * 
 * Business logic layer for content ingestion.
 * Handles parsing, normalization, and content creation.
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly repository: IngestRepository,
    private readonly youtubeParser: YouTubeParser,
    private readonly rssParser: RSSParser,
    private readonly apiParser: APIParser,
    private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Create ingest job
   */
  async createJob(
    sourceType: SourceType,
    sourceUrl: string,
    metadata?: Record<string, any>,
  ): Promise<IngestJob> {
    this.logger.log(`Creating ingest job: ${sourceType} - ${sourceUrl}`);

    const job = await this.repository.create({
      sourceType,
      sourceUrl,
      metadata,
    });

    this.logger.log(`Ingest job created: ${job.id}`);
    return job;
  }

  /**
   * Process ingest job
   */
  async processJob(jobId: string): Promise<IngestJob> {
    this.logger.log(`Processing ingest job: ${jobId}`);

    const job = await this.repository.findById(jobId);
    throwIfNotFound(job, 'IngestJob', jobId);

    // Update status to PROCESSING
    let updatedJob = await this.repository.update(job!.id, {
      status: IngestStatus.PROCESSING,
    });

    try {
      let normalizedContent: NormalizedContent;
      let contentId: string;

      // Process based on source type
      switch (job!.sourceType) {
        case SourceType.YOUTUBE:
          normalizedContent = await this.processYouTube(job!.sourceUrl, job!.metadata);
          break;
        case SourceType.RSS:
          normalizedContent = await this.processRSS(job!.sourceUrl, job!.metadata);
          break;
        case SourceType.API:
          normalizedContent = await this.processAPI(job!.sourceUrl, job!.metadata);
          break;
        default:
          throw new BadRequestException(`Unsupported source type: ${job!.sourceType}`);
      }

      // In a real implementation, you would create content in CMS service here
      // For now, we'll generate a mock content ID
      contentId = `content-${Date.now()}`;

      // Update job with success
      updatedJob = await this.repository.update(job!.id, {
        status: IngestStatus.COMPLETED,
        contentId,
        metadata: {
          ...job!.metadata,
          normalizedContent,
        },
      });

      // Emit ingest.completed event
      await this.kafkaService.emitIngestCompleted({
        jobId: updatedJob.id,
        contentId,
        sourceType: updatedJob.sourceType,
        sourceUrl: updatedJob.sourceUrl,
      });

      this.logger.log(`Ingest job completed: ${jobId} -> ${contentId}`);
    } catch (error: any) {
      this.logger.error(`Ingest job failed: ${jobId}`, error);

      const retryCount = job!.retryCount + 1;
      const shouldRetry = retryCount < INGEST_CONFIG.MAX_RETRIES;

      updatedJob = await this.repository.update(job!.id, {
        status: shouldRetry ? IngestStatus.PENDING : IngestStatus.FAILED,
        errorMessage: error.message,
        retryCount,
      });

      // Emit ingest.failed event
      await this.kafkaService.emitIngestFailed({
        jobId: updatedJob.id,
        sourceType: updatedJob.sourceType,
        sourceUrl: updatedJob.sourceUrl,
        error: error.message,
        retryCount,
      });

      if (!shouldRetry) {
        throw error;
      }
    }

    return updatedJob;
  }

  /**
   * Process YouTube source
   */
  async processYouTube(
    sourceUrl: string,
    metadata?: Record<string, any>,
  ): Promise<NormalizedContent> {
    this.logger.log(`Processing YouTube source: ${sourceUrl}`);

    try {
      const videoId = this.youtubeParser.extractVideoId(sourceUrl);
      const videoData = await this.youtubeParser.fetchVideoMetadata(videoId);

      return this.normalizeContent({
        title: videoData.title,
        description: videoData.description,
        contentType: ContentType.PROGRAM,
        metadata: {
          ...metadata,
          youtube: {
            videoId: videoData.id,
            channelId: videoData.channelId,
            channelTitle: videoData.channelTitle,
            viewCount: videoData.viewCount,
            likeCount: videoData.likeCount,
            publishedAt: videoData.publishedAt,
          },
          thumbnailUrl: videoData.thumbnailUrl,
          duration: videoData.duration,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process YouTube source: ${sourceUrl}`, error);
      throw new BadRequestException(`YouTube processing failed: ${error.message}`);
    }
  }

  /**
   * Process RSS source
   */
  async processRSS(
    sourceUrl: string,
    metadata?: Record<string, any>,
  ): Promise<NormalizedContent> {
    this.logger.log(`Processing RSS source: ${sourceUrl}`);

    try {
      const feed = await this.rssParser.parseFeed(sourceUrl);

      const episodes = feed.items.map((item: any) => ({
        title: item.title,
        description: item.description,
        episodeNumber: this.rssParser.extractEpisodeNumber(item),
        url: item.enclosure?.url || item.link,
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
      }));

      return this.normalizeContent({
        title: feed.title,
        description: feed.description,
        contentType: ContentType.PROGRAM,
        metadata: {
          ...metadata,
          rss: {
            link: feed.link,
            itemCount: feed.items.length,
          },
        },
        episodes,
      });
    } catch (error: any) {
      this.logger.error(`Failed to process RSS source: ${sourceUrl}`, error);
      throw new BadRequestException(`RSS processing failed: ${error.message}`);
    }
  }

  /**
   * Process API source
   */
  async processAPI(
    sourceUrl: string,
    metadata?: Record<string, any>,
  ): Promise<NormalizedContent> {
    this.logger.log(`Processing API source: ${sourceUrl}`);

    try {
      const apiData = await this.apiParser.fetchFromAPI(sourceUrl, {
        headers: metadata?.headers,
        params: metadata?.params,
        method: metadata?.method || 'GET',
        body: metadata?.body,
      });

      // Normalize API response using mapping if provided
      const normalized = metadata?.mapping
        ? this.apiParser.normalizeAPIResponse(apiData, metadata.mapping)
        : apiData;

      return this.normalizeContent({
        title: normalized.title || normalized.name || 'Untitled',
        description: normalized.description,
        contentType: ContentType.PROGRAM,
        metadata: {
          ...metadata,
          api: {
            raw: apiData,
          },
        },
        episodes: normalized.episodes || normalized.items || [],
      });
    } catch (error: any) {
      this.logger.error(`Failed to process API source: ${sourceUrl}`, error);
      throw new BadRequestException(`API processing failed: ${error.message}`);
    }
  }

  /**
   * Normalize content to internal format
   */
  normalizeContent(data: {
    title: string;
    description?: string;
    contentType: ContentType;
    metadata?: Record<string, any>;
    episodes?: any[];
  }): NormalizedContent {
    return {
      title: data.title,
      description: data.description,
      contentType: data.contentType,
      metadata: data.metadata,
      episodes: data.episodes?.map((ep, index) => ({
        title: ep.title || `Episode ${index + 1}`,
        description: ep.description,
        episodeNumber: ep.episodeNumber || index + 1,
        duration: ep.duration,
        url: ep.url || ep.link,
        thumbnailUrl: ep.thumbnailUrl || ep.thumbnail,
        publishedAt: ep.publishedAt ? new Date(ep.publishedAt) : undefined,
      })),
    };
  }

  /**
   * Find ingest job by ID
   */
  async findOne(id: string): Promise<IngestJob> {
    const job = await this.repository.findById(id);
    throwIfNotFound(job, 'IngestJob', id);
    return job!;
  }

  /**
   * Find all ingest jobs with pagination
   */
  async findAll(
    status?: IngestStatus,
    sourceType?: SourceType,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ jobs: IngestJob[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const result = await this.repository.findAll(status, sourceType, skip, limit);

    return {
      ...result,
      page,
      limit,
    };
  }

  /**
   * Retry failed job
   */
  async retryJob(id: string): Promise<IngestJob> {
    this.logger.log(`Retrying ingest job: ${id}`);

    const job = await this.findOne(id);

    if (job.status !== IngestStatus.FAILED) {
      throw new BadRequestException('Only failed jobs can be retried');
    }

    if (job.retryCount >= INGEST_CONFIG.MAX_RETRIES) {
      throw new BadRequestException('Maximum retry count reached');
    }

    // Reset job to pending
    const updatedJob = await this.repository.update(id, {
      status: IngestStatus.PENDING,
      errorMessage: undefined,
    });

    // Process the job
    return await this.processJob(id);
  }

  /**
   * Delete ingest job
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting ingest job: ${id}`);
    // Verify job exists
    await this.findOne(id);
    await this.repository.delete(id);
  }
}
