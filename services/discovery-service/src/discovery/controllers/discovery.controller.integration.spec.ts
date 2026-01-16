import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import request from 'supertest';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from '../services/discovery.service';
import { DiscoveryRepository } from '../repositories/discovery.repository';
import { ContentStatus, ContentType } from '@mediamesh/shared';

describe('DiscoveryController (integration)', () => {
  let app: INestApplication;
  let discoveryService: DiscoveryService;
  let discoveryRepository: jest.Mocked<DiscoveryRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockProgram = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Program',
    description: 'Test Description',
    status: ContentStatus.PUBLISHED,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockEpisode = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    programId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Episode',
    episodeNumber: 1,
    status: ContentStatus.PUBLISHED,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockRepository = {
      search: jest.fn(),
      findPrograms: jest.fn(),
      findProgramById: jest.fn(),
      findEpisodesByProgramId: jest.fn(),
      findTrending: jest.fn(),
      findPopular: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DiscoveryController],
      providers: [
        DiscoveryService,
        {
          provide: DiscoveryRepository,
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    discoveryService = moduleFixture.get<DiscoveryService>(DiscoveryService);
    discoveryRepository = moduleFixture.get(DiscoveryRepository);
    cacheManager = moduleFixture.get(CACHE_MANAGER);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /discovery/search', () => {
    it('should return search results', async () => {
      const searchResult = {
        programs: [mockProgram],
        episodes: [mockEpisode],
        total: 2,
        page: 1,
        limit: 20,
      };

      cacheManager.get.mockResolvedValue(null);
      discoveryRepository.search.mockResolvedValue({
        programs: [mockProgram],
        episodes: [mockEpisode],
        total: 2,
      });
      cacheManager.set.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/discovery/search')
        .query({ q: 'test' })
        .expect(200);

      expect(response.body).toMatchObject({
        programs: expect.any(Array),
        episodes: expect.any(Array),
        total: 2,
      });
      expect(response.headers['cache-control']).toBeDefined();
    });

    it('should return cached results', async () => {
      const cachedResult = {
        programs: [mockProgram],
        episodes: [],
        total: 1,
        page: 1,
        limit: 20,
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const response = await request(app.getHttpServer())
        .get('/discovery/search')
        .query({ q: 'test' })
        .expect(200);

      expect(response.body).toMatchObject({
        programs: expect.any(Array),
        episodes: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(discoveryRepository.search).not.toHaveBeenCalled();
    });
  });

  describe('GET /discovery/programs', () => {
    it('should return programs with pagination', async () => {
      const programsResult = {
        programs: [mockProgram],
        total: 1,
        page: 1,
        limit: 20,
      };

      cacheManager.get.mockResolvedValue(null);
      discoveryRepository.findPrograms.mockResolvedValue({
        programs: [mockProgram],
        total: 1,
      });
      cacheManager.set.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/discovery/programs')
        .expect(200);

      expect(response.body).toMatchObject({
        programs: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(response.headers['cache-control']).toBeDefined();
    });
  });

  describe('GET /discovery/programs/:id', () => {
    it('should return program by ID', async () => {
      cacheManager.get.mockResolvedValue(null);
      discoveryRepository.findProgramById.mockResolvedValue(mockProgram);
      cacheManager.set.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get(`/discovery/programs/${mockProgram.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockProgram.id,
        title: mockProgram.title,
      });
    });

    it('should return 404 if program not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      discoveryRepository.findProgramById.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/discovery/programs/non-existent')
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Program not found',
      });
    });
  });

  describe('GET /discovery/programs/:id/episodes', () => {
    it('should return episodes for program', async () => {
      const episodesResult = {
        episodes: [mockEpisode],
        total: 1,
        page: 1,
        limit: 20,
      };

      cacheManager.get.mockResolvedValue(null);
      discoveryRepository.findEpisodesByProgramId.mockResolvedValue({
        episodes: [mockEpisode],
        total: 1,
      });
      cacheManager.set.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get(`/discovery/programs/${mockProgram.id}/episodes`)
        .expect(200);

      expect(response.body).toMatchObject({
        episodes: expect.any(Array),
        total: 1,
      });
    });
  });

  describe('GET /discovery/trending', () => {
    it('should return trending content', async () => {
      const trending = [mockProgram];

      cacheManager.get.mockResolvedValue(null);
      discoveryRepository.findTrending.mockResolvedValue(trending);
      cacheManager.set.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/discovery/trending')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockProgram.id,
        title: mockProgram.title,
      });
      expect(response.headers['cache-control']).toBeDefined();
    });
  });

  describe('GET /discovery/popular', () => {
    it('should return popular content', async () => {
      const popular = [mockProgram];

      cacheManager.get.mockResolvedValue(null);
      discoveryRepository.findPopular.mockResolvedValue(popular);
      cacheManager.set.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/discovery/popular')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockProgram.id,
        title: mockProgram.title,
      });
      expect(response.headers['cache-control']).toBeDefined();
    });
  });
});
