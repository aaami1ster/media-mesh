import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { MediaController } from './media.controller';
import { MediaService } from '../services/media.service';
import { MediaRepository } from '../repositories/media.repository';
import { StorageService } from '../services/storage.service';
import { Media, StorageType } from '../entities/media.entity';
import { ContentType, JwtAuthGuard, RolesGuard } from '@mediamesh/shared';

describe('MediaController (integration)', () => {
  let app: INestApplication;
  let mediaService: MediaService;
  let mediaRepository: jest.Mocked<MediaRepository>;
  let storageService: jest.Mocked<StorageService>;

  const mockMedia: Media = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    contentId: '550e8400-e29b-41d4-a716-446655440002',
    contentType: ContentType.PROGRAM,
    url: 'https://cdn.example.com/media/video.mp4',
    thumbnailUrl: undefined,
    storageType: StorageType.S3,
    storageKey: 'program/550e8400-e29b-41d4-a716-446655440002/1234567890-video.mp4',
    fileSize: BigInt(1048576),
    mimeType: 'video/mp4',
    createdAt: new Date('2024-01-01'),
    toDto: jest.fn(),
  };

  beforeEach(async () => {
    const mockMediaRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByContentId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      countByContentType: jest.fn(),
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      generatePresignedUploadUrl: jest.fn(),
      generatePresignedDownloadUrl: jest.fn(),
      getCDNUrl: jest.fn(),
      generateStorageKey: jest.fn(),
      generateThumbnailKey: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        MediaService,
        {
          provide: MediaRepository,
          useValue: mockMediaRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
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

    mediaService = moduleFixture.get<MediaService>(MediaService);
    mediaRepository = moduleFixture.get(MediaRepository);
    storageService = moduleFixture.get(StorageService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /media/:id', () => {
    it('should return media by ID', async () => {
      mediaRepository.findById.mockResolvedValue(mockMedia);

      const response = await request(app.getHttpServer())
        .get(`/media/${mockMedia.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockMedia.id,
        contentId: mockMedia.contentId,
        contentType: mockMedia.contentType,
        url: mockMedia.url,
      });
    });

    it('should return 404 if media not found', async () => {
      mediaRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/media/non-existent')
        .expect(404);
    });
  });

  describe('GET /media/content/:contentId', () => {
    it('should return media list by content ID', async () => {
      const mediaList = [mockMedia];
      mediaRepository.findByContentId.mockResolvedValue(mediaList);

      const response = await request(app.getHttpServer())
        .get(`/media/content/${mockMedia.contentId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockMedia.id,
        contentId: mockMedia.contentId,
      });
    });

    it('should return empty array if no media found', async () => {
      mediaRepository.findByContentId.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/media/content/${mockMedia.contentId}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /media/:id/thumbnail', () => {
    it('should generate thumbnail successfully', async () => {
      const imageMedia = { ...mockMedia, mimeType: 'image/jpeg', toDto: jest.fn() };
      const thumbnailUrl = 'https://cdn.example.com/thumbnails/thumb.jpg';
      const updatedMedia = { ...imageMedia, thumbnailUrl, toDto: jest.fn() };

      mediaRepository.findById.mockResolvedValue(imageMedia);
      storageService.generateThumbnailKey.mockReturnValue('thumb-key');
      storageService.uploadFile.mockResolvedValue(thumbnailUrl);
      mediaRepository.update.mockResolvedValue(updatedMedia);

      const response = await request(app.getHttpServer())
        .post(`/media/${imageMedia.id}/thumbnail`)
        .send({ width: 320, height: 240 })
        .expect(201);

      expect(response.body).toMatchObject({
        id: imageMedia.id,
        thumbnailUrl: thumbnailUrl,
      });
    });

    it('should return 400 for unsupported media type', async () => {
      const pdfMedia = { ...mockMedia, mimeType: 'application/pdf', toDto: jest.fn() };
      mediaRepository.findById.mockResolvedValue(pdfMedia);

      await request(app.getHttpServer())
        .post(`/media/${pdfMedia.id}/thumbnail`)
        .send({ width: 320, height: 240 })
        .expect(400);
    });

    it('should return 404 if media not found', async () => {
      mediaRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/media/non-existent/thumbnail')
        .send({ width: 320, height: 240 })
        .expect(404);
    });
  });

  describe('DELETE /media/:id', () => {
    it('should delete media successfully', async () => {
      mediaRepository.findById.mockResolvedValue(mockMedia);
      storageService.deleteFile.mockResolvedValue(undefined);
      mediaRepository.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/media/${mockMedia.id}`)
        .expect(204);

      expect(storageService.deleteFile).toHaveBeenCalledWith(mockMedia.storageKey);
      expect(mediaRepository.delete).toHaveBeenCalledWith(mockMedia.id);
    });

    it('should return 404 if media not found', async () => {
      mediaRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/media/non-existent')
        .expect(404);
    });
  });
});
