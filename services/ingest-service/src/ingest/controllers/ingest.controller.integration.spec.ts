import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { IngestController } from './ingest.controller';
import { IngestService } from '../services/ingest.service';
import { IngestRepository } from '../repositories/ingest.repository';
import { YouTubeParser } from '../parsers/youtube.parser';
import { RSSParser } from '../parsers/rss.parser';
import { APIParser } from '../parsers/api.parser';
import { KafkaService } from '../../kafka/kafka.service';
import { IngestJob, SourceType, IngestStatus } from '../entities/ingest-job.entity';
import { JwtAuthGuard, RolesGuard } from '@mediamesh/shared';

describe('IngestController (integration)', () => {
  let app: INestApplication;
  let ingestService: IngestService;
  let ingestRepository: jest.Mocked<IngestRepository>;
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IngestController],
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
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    app = moduleFixture.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    ingestService = moduleFixture.get<IngestService>(IngestService);
    ingestRepository = moduleFixture.get(IngestRepository);
    kafkaService = moduleFixture.get(KafkaService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /ingest/jobs', () => {
    it('should create ingest job successfully', async () => {
      const createDto = {
        sourceType: SourceType.YOUTUBE,
        sourceUrl: 'https://www.youtube.com/watch?v=test123',
      };

      ingestRepository.create.mockResolvedValue(mockJob);

      const response = await request(app.getHttpServer())
        .post('/ingest/jobs')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: mockJob.id,
        sourceType: createDto.sourceType,
        sourceUrl: createDto.sourceUrl,
        status: IngestStatus.PENDING,
      });
    });

    it('should return 400 for invalid source URL', async () => {
      const createDto = {
        sourceType: SourceType.YOUTUBE,
        sourceUrl: 'invalid-url',
      };

      await request(app.getHttpServer()).post('/ingest/jobs').send(createDto).expect(400);
    });

    it('should return 400 for invalid source type', async () => {
      const createDto = {
        sourceType: 'INVALID',
        sourceUrl: 'https://example.com',
      };

      await request(app.getHttpServer()).post('/ingest/jobs').send(createDto).expect(400);
    });
  });

  describe('GET /ingest/jobs', () => {
    it('should return list of jobs', async () => {
      const jobsResult = {
        jobs: [mockJob],
        total: 1,
      };

      ingestRepository.findAll.mockResolvedValue(jobsResult);

      const response = await request(app.getHttpServer())
        .get('/ingest/jobs')
        .expect(200);

      expect(response.body).toMatchObject({
        jobs: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should filter by status', async () => {
      const jobsResult = {
        jobs: [mockJob],
        total: 1,
      };

      ingestRepository.findAll.mockResolvedValue(jobsResult);

      await request(app.getHttpServer())
        .get('/ingest/jobs')
        .query({ status: IngestStatus.PENDING })
        .expect(200);

      expect(ingestRepository.findAll).toHaveBeenCalledWith(
        IngestStatus.PENDING,
        undefined,
        0,
        20,
      );
    });
  });

  describe('GET /ingest/jobs/:id', () => {
    it('should return job by ID', async () => {
      ingestRepository.findById.mockResolvedValue(mockJob);

      const response = await request(app.getHttpServer())
        .get(`/ingest/jobs/${mockJob.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockJob.id,
        sourceType: mockJob.sourceType,
        status: mockJob.status,
      });
    });

    it('should return 404 if job not found', async () => {
      ingestRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/ingest/jobs/non-existent')
        .expect(404);
    });
  });

  describe('POST /ingest/jobs/:id/retry', () => {
    it('should retry failed job', async () => {
      const failedJob = { ...mockJob, status: IngestStatus.FAILED, retryCount: 1, toDto: jest.fn() };
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

      ingestRepository.findById
        .mockResolvedValueOnce(failedJob) // retryJob.findOne
        .mockResolvedValueOnce(pendingJob) // processJob.findById
        .mockResolvedValueOnce(pendingJob); // processJob.findById (second call)

      ingestRepository.update
        .mockResolvedValueOnce(pendingJob) // retryJob.update
        .mockResolvedValueOnce(processingJob) // processJob.update (to PROCESSING)
        .mockResolvedValueOnce(completedJob); // processJob.update (to COMPLETED)

      kafkaService.emitIngestCompleted.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post(`/ingest/jobs/${failedJob.id}/retry`)
        .expect(200);

      expect(response.body.status).toBe(IngestStatus.COMPLETED);
    });

    it('should return 400 if job is not failed', async () => {
      ingestRepository.findById.mockResolvedValue(mockJob);

      await request(app.getHttpServer())
        .post(`/ingest/jobs/${mockJob.id}/retry`)
        .expect(400);
    });
  });

  describe('DELETE /ingest/jobs/:id', () => {
    it('should delete job successfully', async () => {
      ingestRepository.findById.mockResolvedValue(mockJob);
      ingestRepository.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/ingest/jobs/${mockJob.id}`)
        .expect(204);

      expect(ingestRepository.delete).toHaveBeenCalledWith(mockJob.id);
    });

    it('should return 404 if job not found', async () => {
      ingestRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/ingest/jobs/non-existent')
        .expect(404);
    });
  });
});
