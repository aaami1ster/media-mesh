import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestRepository } from '../repositories/ingest.repository';
import { YouTubeParser } from '../parsers/youtube.parser';
import { RSSParser } from '../parsers/rss.parser';
import { APIParser } from '../parsers/api.parser';
import { KafkaService } from '../../kafka/kafka.service';
import { IngestJob, SourceType, IngestStatus } from '../entities/ingest-job.entity';
import { ContentType } from '@mediamesh/shared';

describe('IngestService', () => {
  let service: IngestService;
  let repository: jest.Mocked<IngestRepository>;
  let youtubeParser: jest.Mocked<YouTubeParser>;
  let rssParser: jest.Mocked<RSSParser>;
  let apiParser: jest.Mocked<APIParser>;
  let kafkaService: jest.Mocked<KafkaService>;

  const mockJob: IngestJob = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    sourceType: SourceType.YOUTUBE,
    sourceUrl: 'https://www.youtube.com/watch?v=test123',
    status: IngestStatus.PENDING,
    retryCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toDto: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findPendingJobs: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByStatus: jest.fn(),
    };

    const mockYouTubeParser = {
      extractVideoId: jest.fn(),
      fetchVideoMetadata: jest.fn(),
      fetchChannelVideos: jest.fn(),
    };

    const mockRSSParser = {
      parseFeed: jest.fn(),
      extractEpisodeNumber: jest.fn(),
    };

    const mockAPIParser = {
      fetchFromAPI: jest.fn(),
      normalizeAPIResponse: jest.fn(),
    };

    const mockKafkaService = {
      emitIngestCompleted: jest.fn(),
      emitIngestFailed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: IngestRepository,
          useValue: mockRepository,
        },
        {
          provide: YouTubeParser,
          useValue: mockYouTubeParser,
        },
        {
          provide: RSSParser,
          useValue: mockRSSParser,
        },
        {
          provide: APIParser,
          useValue: mockAPIParser,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
    repository = module.get(IngestRepository);
    youtubeParser = module.get(YouTubeParser);
    rssParser = module.get(RSSParser);
    apiParser = module.get(APIParser);
    kafkaService = module.get(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create ingest job successfully', async () => {
      repository.create.mockResolvedValue(mockJob);

      const result = await service.createJob(
        SourceType.YOUTUBE,
        'https://www.youtube.com/watch?v=test123',
      );

      expect(result).toEqual(mockJob);
      expect(repository.create).toHaveBeenCalledWith({
        sourceType: SourceType.YOUTUBE,
        sourceUrl: 'https://www.youtube.com/watch?v=test123',
        metadata: undefined,
      });
    });
  });

  describe('processJob', () => {
    it('should process YouTube job successfully', async () => {
      const videoData = {
        id: 'test123',
        title: 'Test Video',
        description: 'Test Description',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        channelId: 'channel123',
        channelTitle: 'Test Channel',
        duration: 3600,
      };

      const completedJob = {
        ...mockJob,
        status: IngestStatus.COMPLETED,
        contentId: 'content-123',
        toDto: jest.fn(),
      };

      repository.findById.mockResolvedValue(mockJob);
      repository.update.mockResolvedValueOnce({
        ...mockJob,
        status: IngestStatus.PROCESSING,
        toDto: jest.fn(),
      });
      youtubeParser.extractVideoId.mockReturnValue('test123');
      youtubeParser.fetchVideoMetadata.mockResolvedValue(videoData);
      repository.update.mockResolvedValueOnce(completedJob);
      kafkaService.emitIngestCompleted.mockResolvedValue(undefined);

      const result = await service.processJob(mockJob.id);

      expect(result.status).toBe(IngestStatus.COMPLETED);
      expect(result.contentId).toBeDefined();
      expect(kafkaService.emitIngestCompleted).toHaveBeenCalled();
    });

    it('should handle processing errors and retry', async () => {
      const failedJob = {
        ...mockJob,
        status: IngestStatus.PENDING,
        retryCount: 1,
        errorMessage: 'Processing failed',
        toDto: jest.fn(),
      };

      repository.findById.mockResolvedValue(mockJob);
      repository.update.mockResolvedValueOnce({
        ...mockJob,
        status: IngestStatus.PROCESSING,
        toDto: jest.fn(),
      });
      youtubeParser.extractVideoId.mockImplementation(() => {
        throw new Error('Invalid URL');
      });
      repository.update.mockResolvedValueOnce(failedJob);
      kafkaService.emitIngestFailed.mockResolvedValue(undefined);

      await expect(service.processJob(mockJob.id)).resolves.toEqual(failedJob);
      expect(kafkaService.emitIngestFailed).toHaveBeenCalled();
    });
  });

  describe('processYouTube', () => {
    it('should process YouTube source', async () => {
      const videoData = {
        id: 'test123',
        title: 'Test Video',
        description: 'Test Description',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        channelId: 'channel123',
        channelTitle: 'Test Channel',
        duration: 3600,
      };

      youtubeParser.extractVideoId.mockReturnValue('test123');
      youtubeParser.fetchVideoMetadata.mockResolvedValue(videoData);

      const result = await service.processYouTube('https://www.youtube.com/watch?v=test123');

      expect(result.title).toBe('Test Video');
      expect(result.contentType).toBe(ContentType.PROGRAM);
      expect(result.metadata?.youtube).toBeDefined();
    });
  });

  describe('processRSS', () => {
    it('should process RSS source', async () => {
      const feedData = {
        title: 'Test Podcast',
        description: 'Test Description',
        link: 'https://example.com/podcast',
        items: [
          {
            title: 'Episode 1',
            description: 'Episode description',
            link: 'https://example.com/ep1',
            pubDate: '2024-01-01',
          },
        ],
      };

      rssParser.parseFeed.mockResolvedValue(feedData);
      rssParser.extractEpisodeNumber.mockReturnValue(1);

      const result = await service.processRSS('https://example.com/feed.rss');

      expect(result.title).toBe('Test Podcast');
      expect(result.episodes).toHaveLength(1);
      expect(result.episodes![0].episodeNumber).toBe(1);
    });
  });

  describe('processAPI', () => {
    it('should process API source', async () => {
      const apiData = {
        title: 'API Content',
        description: 'API Description',
        items: [],
      };

      apiParser.fetchFromAPI.mockResolvedValue(apiData);

      const result = await service.processAPI('https://api.example.com/content');

      expect(result.title).toBe('API Content');
      expect(result.contentType).toBe(ContentType.PROGRAM);
    });
  });

  describe('retryJob', () => {
    it('should retry failed job', async () => {
      const failedJob = {
        ...mockJob,
        status: IngestStatus.FAILED,
        retryCount: 1,
        toDto: jest.fn(),
      };

      const completedJob = {
        ...mockJob,
        status: IngestStatus.COMPLETED,
        contentId: 'content-123',
        toDto: jest.fn(),
      };

      const pendingJob = {
        ...failedJob,
        status: IngestStatus.PENDING,
        toDto: jest.fn(),
      };

      const processingJob = {
        ...failedJob,
        status: IngestStatus.PROCESSING,
        toDto: jest.fn(),
      };

      repository.findById
        .mockResolvedValueOnce(failedJob) // retryJob.findOne
        .mockResolvedValueOnce(pendingJob) // processJob.findById
        .mockResolvedValueOnce(pendingJob); // processJob.findById (second call)

      repository.update
        .mockResolvedValueOnce(pendingJob) // retryJob.update
        .mockResolvedValueOnce(processingJob) // processJob.update (to PROCESSING)
        .mockResolvedValueOnce(completedJob); // processJob.update (to COMPLETED)

      youtubeParser.extractVideoId.mockReturnValue('test123');
      youtubeParser.fetchVideoMetadata.mockResolvedValue({
        id: 'test123',
        title: 'Test',
        description: 'Test',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        channelId: 'channel123',
        channelTitle: 'Test Channel',
        duration: 3600,
      });
      kafkaService.emitIngestCompleted.mockResolvedValue(undefined);

      const result = await service.retryJob(failedJob.id);

      expect(result.status).toBe(IngestStatus.COMPLETED);
    });

    it('should throw error if job is not failed', async () => {
      repository.findById.mockResolvedValue(mockJob);

      await expect(service.retryJob(mockJob.id)).rejects.toThrow(BadRequestException);
    });
  });
});
