import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ProgramsController } from './programs.controller';
import { ProgramService } from '../services/program.service';
import { ProgramRepository } from '../repositories/program.repository';
import { KafkaService } from '../../kafka/kafka.service';
import { Program } from '../entities/program.entity';
import { ContentStatus } from '@mediamesh/shared';

describe('ProgramsController (integration)', () => {
  let app: INestApplication;
  let programService: ProgramService;
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProgramsController],
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

    app = moduleFixture.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    programService = moduleFixture.get<ProgramService>(ProgramService);
    programRepository = moduleFixture.get(ProgramRepository);
    kafkaService = moduleFixture.get(KafkaService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /programs', () => {
    it('should return all programs', async () => {
      const programs = [mockProgram];
      programRepository.findAll.mockResolvedValue(programs);

      const response = await request(app.getHttpServer()).get('/programs').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockProgram.id,
        title: mockProgram.title,
      });
    });

    it('should support pagination', async () => {
      const programs = [mockProgram];
      programRepository.findAll.mockResolvedValue(programs);

      await request(app.getHttpServer())
        .get('/programs')
        .query({ skip: '10', take: '20' })
        .expect(200);

      expect(programRepository.findAll).toHaveBeenCalledWith(10, 20);
    });

    it('should filter by status', async () => {
      const programs = [mockProgram];
      programRepository.findByStatus.mockResolvedValue(programs);

      await request(app.getHttpServer())
        .get('/programs')
        .query({ status: ContentStatus.DRAFT })
        .expect(200);

      expect(programRepository.findByStatus).toHaveBeenCalledWith(ContentStatus.DRAFT, 0, 20);
    });
  });

  describe('GET /programs/:id', () => {
    it('should return a program by ID', async () => {
      programRepository.findById.mockResolvedValue(mockProgram);

      const response = await request(app.getHttpServer())
        .get('/programs/program-1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockProgram.id,
        title: mockProgram.title,
      });
    });

    it('should return 404 if program not found', async () => {
      programRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/programs/non-existent').expect(404);
    });
  });

  describe('POST /programs', () => {
    it('should create a new program', async () => {
      const createDto = {
        title: 'New Program',
        description: 'New Description',
        contentType: 'PROGRAM',
      };

      const createdProgram = { ...mockProgram, ...createDto };
      programRepository.create.mockResolvedValue(createdProgram);

      const response = await request(app.getHttpServer())
        .post('/programs')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: createdProgram.id,
        title: createDto.title,
      });
      expect(programRepository.create).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/programs')
        .send({ description: 'Missing title' })
        .expect(400);
    });
  });

  describe('PUT /programs/:id', () => {
    it('should update a program', async () => {
      const updateDto = {
        title: 'Updated Title',
        contentType: 'PROGRAM',
      };

      programRepository.findById.mockResolvedValue(mockProgram);
      programRepository.update.mockResolvedValue({ ...mockProgram, ...updateDto });

      const response = await request(app.getHttpServer())
        .put('/programs/program-1')
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockProgram.id,
        title: updateDto.title,
      });
    });

    it('should return 404 if program not found', async () => {
      programRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/programs/non-existent')
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /programs/:id', () => {
    it('should delete a program', async () => {
      programRepository.findById.mockResolvedValue(mockProgram);
      programRepository.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer()).delete('/programs/program-1').expect(204);

      expect(programRepository.delete).toHaveBeenCalledWith('program-1');
    });

    it('should return 404 if program not found', async () => {
      programRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).delete('/programs/non-existent').expect(404);
    });
  });

  describe('POST /programs/:id/publish', () => {
    it('should publish a program', async () => {
      const draftProgram = { ...mockProgram, status: ContentStatus.DRAFT };
      const publishedAt = new Date();
      const publishedProgram = {
        ...draftProgram,
        status: ContentStatus.PUBLISHED,
        publishedAt,
      };

      programRepository.findById.mockResolvedValue(draftProgram);
      programRepository.update.mockResolvedValue(publishedProgram);

      const response = await request(app.getHttpServer())
        .post('/programs/program-1/publish')
        .expect(200);

      expect(response.body.status).toBe(ContentStatus.PUBLISHED);
      expect(kafkaService.emitContentPublished).toHaveBeenCalled();
    });

    it('should return 409 if program already published', async () => {
      const publishedProgram = {
        ...mockProgram,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      };

      programRepository.findById.mockResolvedValue(publishedProgram);

      await request(app.getHttpServer())
        .post('/programs/program-1/publish')
        .expect(409);
    });
  });

  describe('POST /programs/:id/unpublish', () => {
    it('should unpublish a program', async () => {
      const publishedAt = new Date();
      const publishedProgram = {
        ...mockProgram,
        status: ContentStatus.PUBLISHED,
        publishedAt,
      };
      const unpublishedProgram = {
        ...publishedProgram,
        status: ContentStatus.DRAFT,
      };

      programRepository.findById.mockResolvedValue(publishedProgram);
      programRepository.update.mockResolvedValue(unpublishedProgram);

      const response = await request(app.getHttpServer())
        .post('/programs/program-1/unpublish')
        .expect(200);

      expect(response.body.status).toBe(ContentStatus.DRAFT);
    });

    it('should return 409 if program already in draft', async () => {
      const draftProgram = { ...mockProgram, status: ContentStatus.DRAFT };

      programRepository.findById.mockResolvedValue(draftProgram);

      await request(app.getHttpServer())
        .post('/programs/program-1/unpublish')
        .expect(409);
    });
  });
});
