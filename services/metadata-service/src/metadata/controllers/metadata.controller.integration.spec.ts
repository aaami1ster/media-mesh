import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { MetadataController } from './metadata.controller';
import { MetadataService } from '../services/metadata.service';
import { MetadataRepository } from '../repositories/metadata.repository';
import { Metadata, MetadataVersion } from '../entities/metadata.entity';
import { ContentType, JwtAuthGuard, RolesGuard } from '@mediamesh/shared';
import { MetadataCategory } from '../dto/metadata.dto';

describe('MetadataController (integration)', () => {
  let app: INestApplication;
  let metadataService: MetadataService;
  let metadataRepository: jest.Mocked<MetadataRepository>;

  const mockMetadata: Metadata = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Metadata',
    description: 'Test Description',
    category: MetadataCategory.MOVIE,
    language: 'en',
    duration: 3600,
    publishDate: new Date('2024-01-01'),
    contentId: '550e8400-e29b-41d4-a716-446655440002',
    contentType: ContentType.PROGRAM,
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toDto: jest.fn(),
  };

  const mockVersion: MetadataVersion = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    metadataId: mockMetadata.id,
    title: 'Old Title',
    description: 'Old Description',
    category: MetadataCategory.MOVIE,
    language: 'en',
    duration: 1800,
    publishDate: new Date('2024-01-01'),
    contentId: mockMetadata.contentId,
    contentType: ContentType.PROGRAM,
    version: 1,
    createdAt: new Date('2024-01-01'),
    toDto: jest.fn(),
  };

  beforeEach(async () => {
    const mockMetadataRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByContentId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      getVersionHistory: jest.fn(),
      getVersion: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      countByContentType: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MetadataController],
      providers: [
        MetadataService,
        {
          provide: MetadataRepository,
          useValue: mockMetadataRepository,
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

    metadataService = moduleFixture.get<MetadataService>(MetadataService);
    metadataRepository = moduleFixture.get(MetadataRepository);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /metadata', () => {
    it('should create metadata successfully', async () => {
      const createDto = {
        title: 'New Metadata',
        description: 'New Description',
        category: MetadataCategory.MOVIE,
        language: 'en',
        duration: 3600,
        contentId: '550e8400-e29b-41d4-a716-446655440002',
        contentType: ContentType.PROGRAM,
      };

      metadataRepository.findByContentId.mockResolvedValue(null);
      const createdMetadata = { ...mockMetadata, ...createDto, toDto: jest.fn() };
      metadataRepository.create.mockResolvedValue(createdMetadata);

      const response = await request(app.getHttpServer())
        .post('/metadata')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: mockMetadata.id,
        title: createDto.title,
        contentId: createDto.contentId,
        contentType: createDto.contentType,
        version: 1,
      });
      expect(metadataRepository.create).toHaveBeenCalled();
    });

    it('should return 400 for invalid title', async () => {
      const createDto = {
        title: '', // Invalid: empty title
        contentId: '550e8400-e29b-41d4-a716-446655440002',
        contentType: ContentType.PROGRAM,
      };

      await request(app.getHttpServer()).post('/metadata').send(createDto).expect(400);
    });

    it('should return 400 for invalid UUID', async () => {
      const createDto = {
        title: 'Valid Title',
        contentId: 'invalid-uuid',
        contentType: ContentType.PROGRAM,
      };

      await request(app.getHttpServer()).post('/metadata').send(createDto).expect(400);
    });

    it('should return 400 for invalid duration', async () => {
      const createDto = {
        title: 'Valid Title',
        contentId: '550e8400-e29b-41d4-a716-446655440002',
        contentType: ContentType.PROGRAM,
        duration: -1, // Invalid: negative duration
      };

      await request(app.getHttpServer()).post('/metadata').send(createDto).expect(400);
    });

    it('should return 409 if metadata already exists', async () => {
      const createDto = {
        title: 'New Metadata',
        contentId: '550e8400-e29b-41d4-a716-446655440002',
        contentType: ContentType.PROGRAM,
      };

      metadataRepository.findByContentId.mockResolvedValue(mockMetadata);

      await request(app.getHttpServer()).post('/metadata').send(createDto).expect(409);
    });
  });

  describe('GET /metadata/:id', () => {
    it('should return metadata by ID', async () => {
      metadataRepository.findById.mockResolvedValue(mockMetadata);

      const response = await request(app.getHttpServer())
        .get(`/metadata/${mockMetadata.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockMetadata.id,
        title: mockMetadata.title,
        contentId: mockMetadata.contentId,
      });
    });

    it('should return 404 if metadata not found', async () => {
      metadataRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/metadata/non-existent')
        .expect(404);
    });
  });

  describe('GET /metadata/content/:contentId', () => {
    it('should return metadata by content ID', async () => {
      metadataRepository.findByContentId.mockResolvedValue(mockMetadata);

      const response = await request(app.getHttpServer())
        .get(`/metadata/content/${mockMetadata.contentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockMetadata.id,
        contentId: mockMetadata.contentId,
      });
    });

    it('should return 404 if metadata not found', async () => {
      metadataRepository.findByContentId.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/metadata/content/non-existent')
        .expect(404);
    });
  });

  describe('PUT /metadata/:id', () => {
    it('should update metadata successfully', async () => {
      const updateDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedMetadata = { ...mockMetadata, ...updateDto, version: 2, toDto: jest.fn() };
      metadataRepository.findById.mockResolvedValue(mockMetadata);
      metadataRepository.update.mockResolvedValue(updatedMetadata);

      const response = await request(app.getHttpServer())
        .put(`/metadata/${mockMetadata.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockMetadata.id,
        title: updateDto.title,
        version: 2,
      });
    });

    it('should return 400 for invalid update data', async () => {
      const updateDto = {
        duration: -1, // Invalid: negative duration
      };

      metadataRepository.findById.mockResolvedValue(mockMetadata);

      await request(app.getHttpServer())
        .put(`/metadata/${mockMetadata.id}`)
        .send(updateDto)
        .expect(400);
    });

    it('should return 404 if metadata not found', async () => {
      metadataRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/metadata/non-existent')
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('GET /metadata/:id/versions', () => {
    it('should return version history', async () => {
      const versions = [mockVersion];
      metadataRepository.findById.mockResolvedValue(mockMetadata);
      metadataRepository.getVersionHistory.mockResolvedValue(versions);

      const response = await request(app.getHttpServer())
        .get(`/metadata/${mockMetadata.id}/versions`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockVersion.id,
        metadataId: mockVersion.metadataId,
        version: mockVersion.version,
      });
    });

    it('should return 404 if metadata not found', async () => {
      metadataRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/metadata/non-existent/versions')
        .expect(404);
    });

    it('should return empty array if no versions', async () => {
      metadataRepository.findById.mockResolvedValue(mockMetadata);
      metadataRepository.getVersionHistory.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/metadata/${mockMetadata.id}/versions`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
