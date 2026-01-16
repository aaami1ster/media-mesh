import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { EpisodesController } from './episodes.controller';
import { EpisodeService } from '../services/episode.service';
import { EpisodeRepository } from '../repositories/episode.repository';
import { ProgramRepository } from '../../programs/repositories/program.repository';
import { KafkaService } from '../../kafka/kafka.service';
import { Episode } from '../entities/episode.entity';
import { Program } from '../../programs/entities/program.entity';
import { ContentStatus } from '@mediamesh/shared';

describe('EpisodesController (integration)', () => {
  let app: INestApplication;
  let episodeService: EpisodeService;
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EpisodesController],
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

    app = moduleFixture.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    episodeService = moduleFixture.get<EpisodeService>(EpisodeService);
    episodeRepository = moduleFixture.get(EpisodeRepository);
    programRepository = moduleFixture.get(ProgramRepository);
    kafkaService = moduleFixture.get(KafkaService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /programs/:programId/episodes', () => {
    it('should return episodes for a program', async () => {
      const episodes = [mockEpisode];
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue(episodes);

      const response = await request(app.getHttpServer())
        .get('/programs/program-1/episodes')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockEpisode.id,
        title: mockEpisode.title,
        programId: mockEpisode.programId,
      });
    });

    it('should support pagination', async () => {
      const episodes = [mockEpisode];
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue(episodes);

      await request(app.getHttpServer())
        .get('/programs/program-1/episodes')
        .query({ skip: '10', take: '20' })
        .expect(200);

      expect(episodeRepository.findByProgramId).toHaveBeenCalledWith('program-1', 10, 20);
    });

    it('should return 404 if program not found', async () => {
      programRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/programs/non-existent/episodes')
        .expect(404);
    });
  });

  describe('GET /episodes', () => {
    it('should return all episodes', async () => {
      const episodes = [mockEpisode];
      episodeRepository.findAll.mockResolvedValue(episodes);

      const response = await request(app.getHttpServer()).get('/episodes').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockEpisode.id,
        title: mockEpisode.title,
      });
    });

    it('should filter by status', async () => {
      const episodes = [mockEpisode];
      episodeRepository.findByStatus.mockResolvedValue(episodes);

      await request(app.getHttpServer())
        .get('/episodes')
        .query({ status: ContentStatus.DRAFT })
        .expect(200);

      expect(episodeRepository.findByStatus).toHaveBeenCalledWith(ContentStatus.DRAFT, 0, 20);
    });
  });

  describe('GET /episodes/:id', () => {
    it('should return an episode by ID', async () => {
      episodeRepository.findById.mockResolvedValue(mockEpisode);

      const response = await request(app.getHttpServer())
        .get('/episodes/episode-1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockEpisode.id,
        title: mockEpisode.title,
      });
    });

    it('should return 404 if episode not found', async () => {
      episodeRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/episodes/non-existent').expect(404);
    });
  });

  describe('POST /episodes', () => {
    it('should create a new episode', async () => {
      const createDto = {
        programId: 'program-1',
        title: 'New Episode',
        episodeNumber: 1,
      };

      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue([]);
      episodeRepository.create.mockResolvedValue(mockEpisode);

      const response = await request(app.getHttpServer())
        .post('/episodes')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: mockEpisode.id,
        title: createDto.title,
        programId: createDto.programId,
      });
      expect(episodeRepository.create).toHaveBeenCalled();
      expect(kafkaService.emitContentCreated).toHaveBeenCalled();
    });

    it('should return 404 if program not found', async () => {
      programRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/episodes')
        .send({
          programId: 'non-existent',
          title: 'Episode',
          episodeNumber: 1,
        })
        .expect(404);
    });

    it('should return 409 if episode number already exists', async () => {
      const existingEpisode = { ...mockEpisode, toDto: jest.fn(), episodeNumber: 1, toDto: jest.fn() };
      programRepository.findById.mockResolvedValue(mockProgram);
      episodeRepository.findByProgramId.mockResolvedValue([existingEpisode]);

      await request(app.getHttpServer())
        .post('/episodes')
        .send({
          programId: 'program-1',
          title: 'Episode',
          episodeNumber: 1,
        })
        .expect(409);
    });
  });

  describe('PUT /episodes/:id', () => {
    it('should update an episode', async () => {
      const updateDto = {
        title: 'Updated Title',
      };

      episodeRepository.findById.mockResolvedValue(mockEpisode);
      episodeRepository.findByProgramId.mockResolvedValue([]);
      episodeRepository.update.mockResolvedValue({ ...mockEpisode, toDto: jest.fn(), ...updateDto, toDto: jest.fn() });
      programRepository.findById.mockResolvedValue(mockProgram);

      const response = await request(app.getHttpServer())
        .put('/episodes/episode-1')
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockEpisode.id,
        title: updateDto.title,
      });
    });

    it('should return 404 if episode not found', async () => {
      episodeRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/episodes/non-existent')
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /episodes/:id', () => {
    it('should delete an episode', async () => {
      episodeRepository.findById.mockResolvedValue(mockEpisode);
      episodeRepository.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer()).delete('/episodes/episode-1').expect(204);

      expect(episodeRepository.delete).toHaveBeenCalledWith('episode-1');
    });

    it('should return 404 if episode not found', async () => {
      episodeRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).delete('/episodes/non-existent').expect(404);
    });
  });
});
