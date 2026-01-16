import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { MetadataRepository } from '../repositories/metadata.repository';
import { Metadata, MetadataVersion } from '../entities/metadata.entity';
import { CreateMetadataDto, UpdateMetadataDto, MetadataCategory } from '../dto/metadata.dto';
import { ContentType } from '@mediamesh/shared';

describe('MetadataService', () => {
  let service: MetadataService;
  let repository: jest.Mocked<MetadataRepository>;

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
    const mockRepository = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataService,
        {
          provide: MetadataRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MetadataService>(MetadataService);
    repository = module.get(MetadataRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateMetadataDto = {
      title: 'Test Metadata',
      description: 'Test Description',
      category: MetadataCategory.MOVIE,
      language: 'en',
      duration: 3600,
      contentId: '550e8400-e29b-41d4-a716-446655440002',
      contentType: ContentType.PROGRAM,
    };

    it('should create metadata successfully', async () => {
      repository.findByContentId.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockMetadata);

      const result = await service.create(createDto);

      expect(result).toEqual(mockMetadata);
      expect(repository.findByContentId).toHaveBeenCalledWith(createDto.contentId);
      expect(repository.create).toHaveBeenCalledWith({
        title: createDto.title,
        description: createDto.description,
        category: createDto.category,
        language: createDto.language,
        duration: createDto.duration,
        publishDate: undefined,
        contentId: createDto.contentId,
        contentType: createDto.contentType,
      });
    });

    it('should throw ConflictException if metadata already exists', async () => {
      repository.findByContentId.mockResolvedValue(mockMetadata);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should validate title length', async () => {
      const invalidDto = { ...createDto, title: '' };
      repository.findByContentId.mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate duration limits', async () => {
      const invalidDto = { ...createDto, duration: 86400 * 25 }; // Exceeds 24 hours
      repository.findByContentId.mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return metadata by ID', async () => {
      repository.findById.mockResolvedValue(mockMetadata);

      const result = await service.findOne(mockMetadata.id);

      expect(result).toEqual(mockMetadata);
      expect(repository.findById).toHaveBeenCalledWith(mockMetadata.id);
    });

    it('should throw NotFoundException if metadata not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('findByContentId', () => {
    it('should return metadata by content ID', async () => {
      repository.findByContentId.mockResolvedValue(mockMetadata);

      const result = await service.findByContentId(mockMetadata.contentId);

      expect(result).toEqual(mockMetadata);
      expect(repository.findByContentId).toHaveBeenCalledWith(mockMetadata.contentId);
    });

    it('should throw NotFoundException if metadata not found', async () => {
      repository.findByContentId.mockResolvedValue(null);

      await expect(service.findByContentId('non-existent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateDto: UpdateMetadataDto = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    it('should update metadata and create new version', async () => {
      const updatedMetadata = {
        ...mockMetadata,
        ...updateDto,
        version: 2,
        publishDate: mockMetadata.publishDate,
        toDto: jest.fn(),
      };
      repository.findById.mockResolvedValue(mockMetadata);
      repository.update.mockResolvedValue(updatedMetadata);

      const result = await service.update(mockMetadata.id, updateDto);

      expect(result).toEqual(updatedMetadata);
      expect(result.version).toBe(2);
      expect(repository.update).toHaveBeenCalledWith(mockMetadata.id, {
        title: updateDto.title,
        description: updateDto.description,
        category: undefined,
        language: undefined,
        duration: undefined,
        publishDate: undefined,
      });
    });

    it('should not create new version if no changes', async () => {
      const updateDtoNoChanges: UpdateMetadataDto = {
        title: mockMetadata.title,
        description: mockMetadata.description,
      };
      repository.findById.mockResolvedValue(mockMetadata);

      const result = await service.update(mockMetadata.id, updateDtoNoChanges);

      expect(result).toEqual(mockMetadata);
      expect(result.version).toBe(1);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if metadata not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow();
    });

    it('should validate update data', async () => {
      const invalidDto = { ...updateDto, duration: -1 };
      repository.findById.mockResolvedValue(mockMetadata);

      await expect(service.update(mockMetadata.id, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history', async () => {
      const versions = [mockVersion];
      repository.findById.mockResolvedValue(mockMetadata);
      repository.getVersionHistory.mockResolvedValue(versions);

      const result = await service.getVersionHistory(mockMetadata.id);

      expect(result).toEqual(versions);
      expect(repository.getVersionHistory).toHaveBeenCalledWith(mockMetadata.id);
    });

    it('should throw NotFoundException if metadata not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getVersionHistory('non-existent')).rejects.toThrow();
    });
  });

  describe('getVersion', () => {
    it('should return specific version', async () => {
      repository.getVersion.mockResolvedValue(mockVersion);

      const result = await service.getVersion(mockMetadata.id, 1);

      expect(result).toEqual(mockVersion);
      expect(repository.getVersion).toHaveBeenCalledWith(mockMetadata.id, 1);
    });

    it('should throw NotFoundException if version not found', async () => {
      repository.getVersion.mockResolvedValue(null);

      await expect(service.getVersion(mockMetadata.id, 999)).rejects.toThrow();
    });
  });

  describe('validateMetadata', () => {
    it('should validate metadata successfully', async () => {
      const createDto: CreateMetadataDto = {
        title: 'Valid Title',
        contentId: '550e8400-e29b-41d4-a716-446655440002',
        contentType: ContentType.PROGRAM,
      };

      const result = await service.validateMetadata(createDto);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException for invalid metadata', async () => {
      const invalidDto: CreateMetadataDto = {
        title: '',
        contentId: '550e8400-e29b-41d4-a716-446655440002',
        contentType: ContentType.PROGRAM,
      };

      await expect(service.validateMetadata(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if content type is missing', async () => {
      const invalidDto = {
        title: 'Valid Title',
        contentId: '550e8400-e29b-41d4-a716-446655440002',
      } as any;

      await expect(service.validateMetadata(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });
});
