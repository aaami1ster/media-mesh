import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EpisodeService } from './episode.service';
import { EpisodeRepository } from '../repositories/episode.repository';
import { ProgramRepository } from '../../programs/repositories/program.repository';
import { KafkaService } from '../../kafka/kafka.service';
import { Episode } from '../entities/episode.entity';
import { Program } from '../../programs/entities/program.entity';
import { ContentStatus } from '@mediamesh/shared';

describe('EpisodeService', () => {
  let service: EpisodeService;
  let episodeRepository: jest.Mocked<EpisodeRepository>;
  let programRepository: jest.Mocked<ProgramRepository>;
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

  const mockEpisode: Episode = {
    id: 'episode-1',
    programId: 'program-1',
    title: 'Test Episode',
    description: 'Test Description',
    episodeNumber: 1,
    duration: 3600,
    status: ContentStatus.DRAFT,
    metadataId: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toDto: jest.fn(),
  };

  beforeEach(async () => {
    const mockEpisodeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByProgramId: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      countByProgramId: jest.fn(),
    };

    const mockProgramRepository = {
      findById: jest.fn(),
    };

    const mockKafkaService = {
      emitContentCreated: jest.fn(),
      emitContentUpdated: jest.fn(),
      emitContentPublished: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpisodeService,
        {
          provide: EpisodeRepository,
          useValue: mockEpisodeRepository,
        },
        {
          provide: ProgramRepository,
          useValue: mockProgramRepository,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    service = module.get<EpisodeService>(EpisodeService);
    episodeRepository = module.get(EpisodeRepository);
    programRepository = module.get(ProgramRepository);
    kafkaService = module.get(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createData = {
      programId: 'program-1',
      title: 'New Episode',
      description: 'New Description',
      episodeNumber: 1,
      duration: 3600,
    };

    it('should create a new episode', async () => {
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue([]);
      episodeRepository.create.mockResolvedValue(mockEpisode);

      const result = await service.create(createData);

      expect(result).toEqual(mockEpisode);
      expect(programRepository.findById).toHaveBeenCalledWith('program-1');
      expect(episodeRepository.create).toHaveBeenCalledWith({
        ...createData,
        status: ContentStatus.DRAFT,
        metadataId: undefined,
      });
      expect(kafkaService.emitContentCreated).toHaveBeenCalled();
    });

    it('should throw NotFoundException if program does not exist', async () => {
      programRepository.findById.mockResolvedValue(null);

      await expect(service.create(createData)).rejects.toThrow(NotFoundException);
      expect(episodeRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if episode number already exists', async () => {
      const existingEpisode = { ...mockEpisode, episodeNumber: 1, toDto: jest.fn() };
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue([existingEpisode]);

      await expect(service.create(createData)).rejects.toThrow(ConflictException);
      expect(episodeRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if episode number is less than 1', async () => {
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue([]);

      await expect(
        service.create({ ...createData, episodeNumber: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if duration is negative', async () => {
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue([]);

      await expect(
        service.create({ ...createData, duration: -1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include program data in created event', async () => {
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue([]);
      episodeRepository.create.mockResolvedValue(mockEpisode);

      await service.create(createData);

      expect(kafkaService.emitContentCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          contentId: mockEpisode.id,
          contentType: 'EPISODE',
          programId: 'program-1',
          episodeNumber: 1,
          program: expect.objectContaining({
            id: mockProgram.id,
            title: mockProgram.title,
          }),
        }),
      );
    });
  });

  describe('findAllByProgram', () => {
    it('should return episodes for a program', async () => {
      const episodes = [mockEpisode];
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue(episodes);

      const result = await service.findAllByProgram('program-1');

      expect(result).toEqual(episodes);
      expect(programRepository.findById).toHaveBeenCalledWith('program-1');
      expect(episodeRepository.findByProgramId).toHaveBeenCalledWith('program-1', 0, 20);
    });

    it('should throw NotFoundException if program does not exist', async () => {
      programRepository.findById.mockResolvedValue(null);

      await expect(service.findAllByProgram('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all episodes with pagination', async () => {
      const episodes = [mockEpisode];
      episodeRepository.findAll.mockResolvedValue(episodes);

      const result = await service.findAll(10, 50);

      expect(result).toEqual(episodes);
      expect(episodeRepository.findAll).toHaveBeenCalledWith(10, 50);
    });
  });

  describe('findOne', () => {
    it('should return an episode by ID', async () => {
      episodeRepository.findById.mockResolvedValue(mockEpisode);

      const result = await service.findOne('episode-1');

      expect(result).toEqual(mockEpisode);
      expect(episodeRepository.findById).toHaveBeenCalledWith('episode-1');
    });

    it('should throw NotFoundException if episode not found', async () => {
      episodeRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Episode'),
        }),
      );
    });
  });

  describe('findByStatus', () => {
    it('should return episodes by status', async () => {
      const episodes = [mockEpisode];
      episodeRepository.findByStatus.mockResolvedValue(episodes);

      const result = await service.findByStatus(ContentStatus.DRAFT);

      expect(result).toEqual(episodes);
      expect(episodeRepository.findByStatus).toHaveBeenCalledWith(ContentStatus.DRAFT, 0, 20);
    });
  });

  describe('update', () => {
    it('should update an episode', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedEpisode = { ...mockEpisode, ...updateData, toDto: jest.fn() };

      episodeRepository.findById.mockResolvedValue(mockEpisode);
      episodeRepository.findByProgramId.mockResolvedValue([]);
      episodeRepository.update.mockResolvedValue(updatedEpisode);
      programRepository.findById.mockResolvedValue(mockProgram);

      const result = await service.update('episode-1', updateData);

      expect(result).toEqual(updatedEpisode);
      expect(episodeRepository.update).toHaveBeenCalled();
    });

    it('should track changes and emit updated event', async () => {
      const existingEpisode = { ...mockEpisode, title: 'Old Title', toDto: jest.fn() };
      const updateData = { title: 'New Title' };
      const updatedEpisode = { ...existingEpisode, ...updateData, toDto: jest.fn() };

      episodeRepository.findById.mockResolvedValue(existingEpisode);
      episodeRepository.findByProgramId.mockResolvedValue([]);
      episodeRepository.update.mockResolvedValue(updatedEpisode);
      programRepository.findById.mockResolvedValue(mockProgram);

      await service.update('episode-1', updateData);

      expect(kafkaService.emitContentUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          contentId: 'episode-1',
          contentType: 'EPISODE',
          title: 'New Title',
          changes: {
            title: { old: 'Old Title', new: 'New Title' },
          },
          program: expect.any(Object),
        }),
      );
    });

    it('should throw ConflictException if episode number already exists', async () => {
      const existingEpisode = { ...mockEpisode, episodeNumber: 1, toDto: jest.fn() };
      const otherEpisode = { ...mockEpisode, id: 'episode-2', episodeNumber: 2, toDto: jest.fn() };
      const updateData = { episodeNumber: 2 };

      episodeRepository.findById.mockResolvedValue(existingEpisode);
      episodeRepository.findByProgramId.mockResolvedValue([existingEpisode, otherEpisode]);

      await expect(service.update('episode-1', updateData)).rejects.toThrow(ConflictException);
    });

    it('should validate status transition', async () => {
      const existingEpisode = { ...mockEpisode, status: ContentStatus.DRAFT, toDto: jest.fn() };
      const updateData = { status: ContentStatus.PUBLISHED };

      episodeRepository.findById.mockResolvedValue(existingEpisode);
      episodeRepository.findByProgramId.mockResolvedValue([]);
      episodeRepository.update.mockResolvedValue({ ...existingEpisode, ...updateData, toDto: jest.fn() });
      programRepository.findById.mockResolvedValue(mockProgram);

      const result = await service.update('episode-1', updateData);

      expect(result.status).toBe(ContentStatus.PUBLISHED);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const existingEpisode = { ...mockEpisode, toDto: jest.fn(), status: ContentStatus.DRAFT };
      const updateData = { status: 'INVALID_STATUS' as any };

      episodeRepository.findById.mockResolvedValue(existingEpisode);
      episodeRepository.findByProgramId.mockResolvedValue([]);

      await expect(service.update('episode-1', updateData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete an episode', async () => {
      episodeRepository.findById.mockResolvedValue(mockEpisode);
      episodeRepository.delete.mockResolvedValue(undefined);

      await service.delete('episode-1');

      expect(episodeRepository.findById).toHaveBeenCalledWith('episode-1');
      expect(episodeRepository.delete).toHaveBeenCalledWith('episode-1');
    });

    it('should throw NotFoundException if episode not found', async () => {
      episodeRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Episode'),
        }),
      );
    });
  });

  describe('countByProgramId', () => {
    it('should return episode count for a program', async () => {
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.countByProgramId.mockResolvedValue(5);

      const result = await service.countByProgramId('program-1');

      expect(result).toBe(5);
      expect(programRepository.findById).toHaveBeenCalledWith('program-1');
      expect(episodeRepository.countByProgramId).toHaveBeenCalledWith('program-1');
    });

    it('should throw NotFoundException if program does not exist', async () => {
      programRepository.findById.mockResolvedValue(null);

      await expect(service.countByProgramId('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
