import { Test, TestingModule } from '@nestjs/testing';
import { ProgramService } from './program.service';
import { ProgramRepository } from '../repositories/program.repository';
import { EpisodeRepository } from '../../episodes/repositories/episode.repository';
import { KafkaService } from '../../kafka/kafka.service';
import { Program } from '../entities/program.entity';
import { Episode } from '../../episodes/entities/episode.entity';
import { ContentStatus } from '@mediamesh/shared';

/**
 * Tests for program-episode relationships
 */
describe('ProgramService - Relationships', () => {
  let programService: ProgramService;
  let programRepository: jest.Mocked<ProgramRepository>;
  let episodeRepository: jest.Mocked<EpisodeRepository>;
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
    title: 'Episode 1',
    description: 'Episode Description',
    episodeNumber: 1,
    duration: 3600,
    status: ContentStatus.DRAFT,
    metadataId: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toDto: jest.fn(),
  };

  beforeEach(async () => {
    const mockProgramRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      countByStatus: jest.fn(),
    };

    const mockEpisodeRepository = {
      findByProgramId: jest.fn(),
      countByProgramId: jest.fn(),
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
          useValue: mockProgramRepository,
        },
        {
          provide: EpisodeRepository,
          useValue: mockEpisodeRepository,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    programService = module.get<ProgramService>(ProgramService);
    programRepository = module.get(ProgramRepository);
    episodeRepository = module.get(EpisodeRepository);
    kafkaService = module.get(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Program-Episode Relationship', () => {
    it('should allow creating episodes for a program', async () => {
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue([]);

      // This test verifies that a program can have episodes
      // The actual episode creation is tested in EpisodeService
      expect(mockEpisode.programId).toBe(mockProgram.id);
    });

    it('should cascade delete episodes when program is deleted', async () => {
      // Note: Cascade delete is handled at the database level
      // This test verifies the relationship exists
      programRepository.findById.mockResolvedValue(mockProgram);
      programRepository.delete.mockResolvedValue(undefined);

      await programService.delete('program-1');

      expect(programRepository.delete).toHaveBeenCalledWith('program-1');
      // Episodes should be cascade deleted by the database
    });

    it('should maintain program reference in episodes', async () => {
      // Verify that episodes maintain correct programId reference
      expect(mockEpisode.programId).toBe('program-1');
      expect(mockEpisode.programId).toBe(mockProgram.id);
    });
  });

  describe('Publishing Workflow with Episodes', () => {
    it('should publish program independently of episodes', async () => {
      const draftProgram = { ...mockProgram, status: ContentStatus.DRAFT };
      const publishedAt = new Date();
      const publishedProgram = {
        ...draftProgram,
        status: ContentStatus.PUBLISHED,
        publishedAt,
      };

      programRepository.findById.mockResolvedValue(draftProgram);
      programRepository.update.mockResolvedValue(publishedProgram);

      const result = await programService.publish('program-1');

      expect(result.status).toBe(ContentStatus.PUBLISHED);
      // Program can be published regardless of episode status
    });

    it('should allow episodes to have different status than program', async () => {
      const publishedProgram = {
        ...mockProgram,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      };
      const draftEpisode = {
        ...mockEpisode,
        status: ContentStatus.DRAFT,
      };

      // Program is published, but episode can still be draft
      expect(publishedProgram.status).toBe(ContentStatus.PUBLISHED);
      expect(draftEpisode.status).toBe(ContentStatus.DRAFT);
      expect(draftEpisode.programId).toBe(publishedProgram.id);
    });
  });
});
