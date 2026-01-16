import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaRepository } from '../repositories/media.repository';
import { StorageService } from './storage.service';
import { Media, StorageType } from '../entities/media.entity';
import { ContentType } from '@mediamesh/shared';

describe('MediaService', () => {
  let service: MediaService;
  let repository: jest.Mocked<MediaRepository>;
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
    const mockRepository = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: MediaRepository,
          useValue: mockRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    repository = module.get(MediaRepository);
    storageService = module.get(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    const fileBuffer = Buffer.from('test file content');
    const filename = 'test-video.mp4';
    const mimeType = 'video/mp4';

    it('should upload media successfully', async () => {
      const storageKey = 'program/content-id/1234567890-test-video.mp4';
      const cdnUrl = 'https://cdn.example.com/media/video.mp4';

      storageService.generateStorageKey.mockReturnValue(storageKey);
      storageService.uploadFile.mockResolvedValue(cdnUrl);
      repository.create.mockResolvedValue(mockMedia);

      const result = await service.upload(
        mockMedia.contentId,
        ContentType.PROGRAM,
        fileBuffer,
        filename,
        mimeType,
      );

      expect(result).toEqual(mockMedia);
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        storageKey,
        fileBuffer,
        mimeType,
        expect.objectContaining({
          contentId: mockMedia.contentId,
          contentType: ContentType.PROGRAM,
        }),
      );
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if file too large', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024 * 1024); // 6GB

      await expect(
        service.upload(
          mockMedia.contentId,
          ContentType.PROGRAM,
          largeBuffer,
          filename,
          mimeType,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return media by ID', async () => {
      repository.findById.mockResolvedValue(mockMedia);

      const result = await service.findOne(mockMedia.id);

      expect(result).toEqual(mockMedia);
      expect(repository.findById).toHaveBeenCalledWith(mockMedia.id);
    });

    it('should throw NotFoundException if media not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('findByContentId', () => {
    it('should return media list by content ID', async () => {
      const mediaList = [mockMedia];
      repository.findByContentId.mockResolvedValue(mediaList);

      const result = await service.findByContentId(mockMedia.contentId);

      expect(result).toEqual(mediaList);
      expect(repository.findByContentId).toHaveBeenCalledWith(mockMedia.contentId);
    });
  });

  describe('delete', () => {
    it('should delete media and file from storage', async () => {
      repository.findById.mockResolvedValue(mockMedia);
      storageService.deleteFile.mockResolvedValue(undefined);
      repository.delete.mockResolvedValue(undefined);

      await service.delete(mockMedia.id);

      expect(storageService.deleteFile).toHaveBeenCalledWith(mockMedia.storageKey);
      expect(repository.delete).toHaveBeenCalledWith(mockMedia.id);
    });

    it('should delete thumbnail if exists', async () => {
      const mediaWithThumbnail = { ...mockMedia, thumbnailUrl: 'https://cdn.example.com/thumb.jpg', toDto: jest.fn() };
      const thumbnailKey = 'program/content-id/1234567890-video.mp4-thumb.jpg';

      repository.findById.mockResolvedValue(mediaWithThumbnail);
      storageService.generateThumbnailKey.mockReturnValue(thumbnailKey);
      storageService.deleteFile.mockResolvedValue(undefined);
      repository.delete.mockResolvedValue(undefined);

      await service.delete(mediaWithThumbnail.id);

      expect(storageService.deleteFile).toHaveBeenCalledWith(thumbnailKey);
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail for image', async () => {
      const imageMedia = { ...mockMedia, mimeType: 'image/jpeg', toDto: jest.fn() };
      const thumbnailKey = 'program/content-id/1234567890-video.mp4-thumb.jpg';
      const thumbnailUrl = 'https://cdn.example.com/thumbnails/thumb.jpg';
      const updatedMedia = { ...imageMedia, thumbnailUrl, toDto: jest.fn() };

      repository.findById.mockResolvedValue(imageMedia);
      storageService.generateThumbnailKey.mockReturnValue(thumbnailKey);
      storageService.uploadFile.mockResolvedValue(thumbnailUrl);
      repository.update.mockResolvedValue(updatedMedia);

      const result = await service.generateThumbnail(imageMedia.id, 320, 240);

      expect(result.thumbnailUrl).toBe(thumbnailUrl);
      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for unsupported media type', async () => {
      const pdfMedia = { ...mockMedia, mimeType: 'application/pdf', toDto: jest.fn() };
      repository.findById.mockResolvedValue(pdfMedia);

      await expect(service.generateThumbnail(pdfMedia.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCDNUrl', () => {
    it('should return CDN URL', () => {
      const cdnUrl = 'https://cdn.example.com/media/video.mp4';
      storageService.getCDNUrl.mockReturnValue(cdnUrl);

      const result = service.getCDNUrl(mockMedia);

      expect(result).toBe(cdnUrl);
      expect(storageService.getCDNUrl).toHaveBeenCalledWith(mockMedia.storageKey);
    });
  });
});
