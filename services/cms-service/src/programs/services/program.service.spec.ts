import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProgramService } from './program.service';
import { ProgramRepository } from '../repositories/program.repository';
import { KafkaService } from '../../kafka/kafka.service';
import { Program } from '../entities/program.entity';
import { ContentStatus } from '@mediamesh/shared';

describe('ProgramService', () => {
  let service: ProgramService;
  let repository: jest.Mocked<ProgramRepository>;
  let kafkaService: jest.Mocked<KafkaService>;

  const mockProgram: Program = {
    id: 'program-1',
    title: 'Test Program',
    description: 'Test Description',
    status: ContentStatus.DRAFT,
    metadataId: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    publishedAt: undefined,
    toDto: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      countByStatus: jest.fn(),
    };

    const mockKafkaService = {
      emitContentCreated: jest.fn(),
      emitContentUpdated: jest.fn(),
      emitContentPublished: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        {
          provide: ProgramRepository,
          useValue: mockRepository,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
    repository = module.get(ProgramRepository);
    kafkaService = module.get(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new program with DRAFT status by default', async () => {
      const createData = {
        title: 'New Program',
        description: 'New Description',
      };

      const createdProgram = { ...mockProgram, toDto: jest.fn(), ...createData };
      repository.create.mockResolvedValue(createdProgram);

      const result = await service.create(createData);

      expect(result).toEqual(createdProgram);
      expect(repository.create).toHaveBeenCalledWith({
        title: createData.title,
        description: createData.description,
        status: ContentStatus.DRAFT,
        metadataId: undefined,
        publishedAt: undefined,
      });
      expect(kafkaService.emitContentCreated).toHaveBeenCalledWith({
        contentId: createdProgram.id,
        contentType: 'PROGRAM',
        title: createdProgram.title,
        description: createdProgram.description,
        status: createdProgram.status,
        metadataId: createdProgram.metadataId,
        createdAt: createdProgram.createdAt,
      });
    });

    it('should create a program with PUBLISHED status and set publishedAt', async () => {
      const createData = {
        title: 'Published Program',
        status: ContentStatus.PUBLISHED,
      };

      const publishedAt = new Date();
      const createdProgram = {
        ...mockProgram,
        ...createData,
        publishedAt,
        toDto: jest.fn(),
      };
      repository.create.mockResolvedValue(createdProgram);

      const result = await service.create(createData);

      expect(result).toEqual(createdProgram);
      expect(repository.create).toHaveBeenCalledWith({
        title: createData.title,
        description: undefined,
        status: ContentStatus.PUBLISHED,
        metadataId: undefined,
        publishedAt: expect.any(Date),
      });
      expect(kafkaService.emitContentCreated).toHaveBeenCalled();
    });

    it('should create a program with metadataId', async () => {
      const createData = {
        title: 'Program with Metadata',
        metadataId: 'metadata-1',
      };

      const createdProgram = { ...mockProgram, toDto: jest.fn(), ...createData };
      repository.create.mockResolvedValue(createdProgram);

      const result = await service.create(createData);

      expect(result).toEqual(createdProgram);
      expect(repository.create).toHaveBeenCalledWith({
        title: createData.title,
        description: undefined,
        status: ContentStatus.DRAFT,
        metadataId: 'metadata-1',
        publishedAt: undefined,
      });
    });
  });

  describe('findAll', () => {
    it('should return all programs with default pagination', async () => {
      const programs = [mockProgram];
      repository.findAll.mockResolvedValue(programs);

      const result = await service.findAll();

      expect(result).toEqual(programs);
      expect(repository.findAll).toHaveBeenCalledWith(0, 20);
    });

    it('should return programs with custom pagination', async () => {
      const programs = [mockProgram];
      repository.findAll.mockResolvedValue(programs);

      const result = await service.findAll(10, 50);

      expect(result).toEqual(programs);
      expect(repository.findAll).toHaveBeenCalledWith(10, 50);
    });
  });

  describe('findOne', () => {
    it('should return a program by ID', async () => {
      repository.findById.mockResolvedValue(mockProgram);

      const result = await service.findOne('program-1');

      expect(result).toEqual(mockProgram);
      expect(repository.findById).toHaveBeenCalledWith('program-1');
    });

    it('should throw NotFoundException if program not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Program'),
        }),
      );
      expect(repository.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('findByStatus', () => {
    it('should return programs by status', async () => {
      const programs = [mockProgram];
      repository.findByStatus.mockResolvedValue(programs);

      const result = await service.findByStatus(ContentStatus.DRAFT);

      expect(result).toEqual(programs);
      expect(repository.findByStatus).toHaveBeenCalledWith(ContentStatus.DRAFT, 0, 20);
    });
  });

  describe('update', () => {
    it('should update a program', async () => {
      const existingProgram = { ...mockProgram, toDto: jest.fn() };
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedProgram = { ...existingProgram, ...updateData, updatedAt: new Date() , toDto: jest.fn() };
      repository.findById.mockResolvedValue(existingProgram);
      repository.update.mockResolvedValue(updatedProgram);

      const result = await service.update('program-1', updateData);

      expect(result).toEqual(updatedProgram);
      expect(repository.update).toHaveBeenCalled();
      expect(kafkaService.emitContentUpdated).toHaveBeenCalled();
    });

    it('should track changes and emit updated event', async () => {
      const existingProgram = { ...mockProgram, toDto: jest.fn(), title: 'Old Title' };
      const updateData = { title: 'New Title' };

      const updatedProgram = { ...existingProgram, ...updateData , toDto: jest.fn() };
      repository.findById.mockResolvedValue(existingProgram);
      repository.update.mockResolvedValue(updatedProgram);

      await service.update('program-1', updateData);

      expect(kafkaService.emitContentUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          contentId: 'program-1',
          contentType: 'PROGRAM',
          title: 'New Title',
          changes: {
            title: { old: 'Old Title', new: 'New Title' },
          },
        }),
      );
    });

    it('should validate status transition', async () => {
      const existingProgram = { ...mockProgram, toDto: jest.fn(), status: ContentStatus.DRAFT };
      const updateData = { status: ContentStatus.PUBLISHED };

      repository.findById.mockResolvedValue(existingProgram);
      repository.update.mockResolvedValue({ ...existingProgram, ...updateData , toDto: jest.fn() });

      const result = await service.update('program-1', updateData);

      expect(result.status).toBe(ContentStatus.PUBLISHED);
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const existingProgram = { ...mockProgram, toDto: jest.fn(), status: ContentStatus.DRAFT };
      const updateData = { status: 'INVALID_STATUS' as any };

      repository.findById.mockResolvedValue(existingProgram);

      await expect(service.update('program-1', updateData)).rejects.toThrow(BadRequestException);
    });

    it('should set publishedAt when publishing via update', async () => {
      const existingProgram = { ...mockProgram, toDto: jest.fn(), status: ContentStatus.DRAFT };
      const updateData = { status: ContentStatus.PUBLISHED };
      const publishedAt = new Date();

      repository.findById.mockResolvedValue(existingProgram);
      repository.update.mockResolvedValue({
        ...existingProgram,
        ...updateData,
        publishedAt,
      });

      await service.update('program-1', updateData);

      expect(repository.update).toHaveBeenCalledWith(
        'program-1',
        expect.objectContaining({
          status: ContentStatus.PUBLISHED,
          publishedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a program', async () => {
      repository.findById.mockResolvedValue(mockProgram);
      repository.delete.mockResolvedValue(undefined);

      await service.delete('program-1');

      expect(repository.findById).toHaveBeenCalledWith('program-1');
      expect(repository.delete).toHaveBeenCalledWith('program-1');
    });

    it('should throw NotFoundException if program not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish a DRAFT program', async () => {
      const draftProgram = { ...mockProgram, toDto: jest.fn(), status: ContentStatus.DRAFT };
      const publishedAt = new Date();
      const publishedProgram = {
        ...draftProgram,
        status: ContentStatus.PUBLISHED,
        publishedAt,
        toDto: jest.fn(),
      };

      repository.findById.mockResolvedValue(draftProgram);
      repository.update.mockResolvedValue(publishedProgram);

      const result = await service.publish('program-1');

      expect(result.status).toBe(ContentStatus.PUBLISHED);
      expect(result.publishedAt).toBeDefined();
      expect(repository.update).toHaveBeenCalledWith('program-1', {
        status: ContentStatus.PUBLISHED,
        publishedAt: expect.any(Date),
      });
      expect(kafkaService.emitContentPublished).toHaveBeenCalledWith(
        expect.objectContaining({
          contentId: 'program-1',
          contentType: 'PROGRAM',
          title: draftProgram.title,
          publishedAt: expect.any(Date),
        }),
      );
    });

    it('should throw ConflictException if program already published', async () => {
      const publishedProgram = {
        ...mockProgram,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        toDto: jest.fn(),
      };

      repository.findById.mockResolvedValue(publishedProgram);

      await expect(service.publish('program-1')).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if program not in DRAFT status', async () => {
      const archivedProgram = {
        ...mockProgram,
        status: 'ARCHIVED' as any,
        toDto: jest.fn(),
      };

      repository.findById.mockResolvedValue(archivedProgram);

      await expect(service.publish('program-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('unpublish', () => {
    it('should unpublish a PUBLISHED program', async () => {
      const publishedAt = new Date();
      const publishedProgram = {
        ...mockProgram,
        status: ContentStatus.PUBLISHED,
        publishedAt,
        toDto: jest.fn(),
      };
      const unpublishedProgram = {
        ...publishedProgram,
        status: ContentStatus.DRAFT,
        // publishedAt should be preserved
        toDto: jest.fn(),
      };

      repository.findById.mockResolvedValue(publishedProgram);
      repository.update.mockResolvedValue(unpublishedProgram);

      const result = await service.unpublish('program-1');

      expect(result.status).toBe(ContentStatus.DRAFT);
      expect(result.publishedAt).toBe(publishedAt); // Preserved for history
      expect(repository.update).toHaveBeenCalledWith('program-1', {
        status: ContentStatus.DRAFT,
      });
    });

    it('should throw ConflictException if program already in DRAFT', async () => {
      const draftProgram = { ...mockProgram, toDto: jest.fn(), status: ContentStatus.DRAFT };

      repository.findById.mockResolvedValue(draftProgram);

      await expect(service.unpublish('program-1')).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if program not in PUBLISHED status', async () => {
      const draftProgram = { ...mockProgram, toDto: jest.fn(), status: ContentStatus.DRAFT };

      repository.findById.mockResolvedValue(draftProgram);

      await expect(service.unpublish('program-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('count', () => {
    it('should return total program count', async () => {
      repository.count.mockResolvedValue(10);

      const result = await service.count();

      expect(result).toBe(10);
      expect(repository.count).toHaveBeenCalled();
    });
  });

  describe('countByStatus', () => {
    it('should return count by status', async () => {
      repository.countByStatus.mockResolvedValue(5);

      const result = await service.countByStatus(ContentStatus.PUBLISHED);

      expect(result).toBe(5);
      expect(repository.countByStatus).toHaveBeenCalledWith(ContentStatus.PUBLISHED);
    });
  });
});
