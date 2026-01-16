import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { SearchController } from './search.controller';
import { SearchService } from '../services/search.service';
import { SearchRepository } from '../repositories/search.repository';
import { SearchIndex } from '../entities/search-index.entity';
import { ContentType, JwtAuthGuard, RolesGuard } from '@mediamesh/shared';

describe('SearchController (integration)', () => {
  let app: INestApplication;
  let searchService: SearchService;
  let searchRepository: jest.Mocked<SearchRepository>;

  const mockIndex: SearchIndex = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    contentId: '550e8400-e29b-41d4-a716-446655440002',
    contentType: ContentType.PROGRAM,
    title: 'Test Program',
    description: 'Test Description',
    category: 'MOVIE',
    language: 'en',
    tags: ['action'],
    indexedAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toDto: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository = {
      upsert: jest.fn(),
      findByContentId: jest.fn(),
      search: jest.fn(),
      delete: jest.fn(),
      getAllContentIds: jest.fn(),
      count: jest.fn(),
      getLastIndexedAt: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        SearchService,
        {
          provide: SearchRepository,
          useValue: mockRepository,
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

    searchService = moduleFixture.get<SearchService>(SearchService);
    searchRepository = moduleFixture.get(SearchRepository);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /search', () => {
    it('should return search results', async () => {
      const searchResult = {
        results: [mockIndex],
        total: 1,
      };

      searchRepository.search.mockResolvedValue(searchResult);

      const response = await request(app.getHttpServer())
        .get('/search')
        .query({ q: 'test' })
        .expect(200);

      expect(response.body).toMatchObject({
        results: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should apply filters', async () => {
      const searchResult = {
        results: [mockIndex],
        total: 1,
      };

      searchRepository.search.mockResolvedValue(searchResult);

      await request(app.getHttpServer())
        .get('/search')
        .query({ q: 'test', contentType: ContentType.PROGRAM, category: 'MOVIE' })
        .expect(200);

      expect(searchRepository.search).toHaveBeenCalledWith(
        'test',
        ContentType.PROGRAM,
        'MOVIE',
        undefined,
        undefined,
        0,
        20,
      );
    });
  });

  describe('POST /search/index', () => {
    it('should index content successfully', async () => {
      const indexDto = {
        contentId: '550e8400-e29b-41d4-a716-446655440002',
        contentType: ContentType.PROGRAM,
        title: 'Test Program',
        description: 'Test Description',
      };

      searchRepository.upsert.mockResolvedValue(mockIndex);

      const response = await request(app.getHttpServer())
        .post('/search/index')
        .send(indexDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: mockIndex.id,
        contentId: indexDto.contentId,
        title: indexDto.title,
      });
    });

    it('should return 400 for invalid content ID', async () => {
      const indexDto = {
        contentId: 'invalid-uuid',
        contentType: ContentType.PROGRAM,
        title: 'Test',
      };

      await request(app.getHttpServer()).post('/search/index').send(indexDto).expect(400);
    });
  });

  describe('GET /search/status', () => {
    it('should return indexing status', async () => {
      searchRepository.count.mockResolvedValue(100);
      searchRepository.getLastIndexedAt.mockResolvedValue(new Date('2024-01-01'));

      const response = await request(app.getHttpServer())
        .get('/search/status')
        .expect(200);

      expect(response.body).toMatchObject({
        totalIndexed: 100,
        lastIndexedAt: expect.any(String),
        indexingInProgress: false,
      });
    });
  });

  describe('POST /search/reindex', () => {
    it('should start reindexing', async () => {
      // Mock axios for CMS service calls
      jest.spyOn(require('axios'), 'default').mockResolvedValue({
        data: [],
      });

      searchRepository.upsert.mockResolvedValue(mockIndex);
      searchRepository.count.mockResolvedValue(0);
      searchRepository.getLastIndexedAt.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/search/reindex')
        .expect(200);

      expect(response.body).toMatchObject({
        indexed: expect.any(Number),
        errors: expect.any(Number),
      });
    });
  });
});
