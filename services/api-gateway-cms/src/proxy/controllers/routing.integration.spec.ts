import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { MetadataController } from './metadata.controller';
import { MediaController } from './media.controller';
import { IngestController } from './ingest.controller';
import { ProxyService } from '../proxy.service';
import { JwtAuthGuard, RolesGuard } from '@mediamesh/shared';

describe('API Gateway Routing (Integration)', () => {
  let app: INestApplication;
  let proxyService: ProxyService;

  const mockUser = {
    id: 'user-123',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const mockProxyService = {
      proxyToCms: jest.fn(),
      proxyToMetadata: jest.fn(),
      proxyToMedia: jest.fn(),
      proxyToIngest: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        CmsController,
        MetadataController,
        MediaController,
        IngestController,
      ],
      providers: [
        {
          provide: ProxyService,
          useValue: mockProxyService,
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
        canActivate: jest.fn((context) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        }),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    proxyService = moduleFixture.get<ProxyService>(ProxyService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('CMS Service Routing', () => {
    it('should route GET /api/v1/cms/programs to CMS service', async () => {
      const mockResponse = [{ id: '1', title: 'Test Program' }];
      (proxyService.proxyToCms as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/cms/programs')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'GET',
        '/programs',
        null,
        expect.any(Object),
      );
    });

    it('should route POST /api/v1/cms/programs to CMS service', async () => {
      const createDto = { title: 'New Program' };
      const mockResponse = { id: '1', ...createDto };
      (proxyService.proxyToCms as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/api/v1/cms/programs')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'POST',
        '/programs',
        createDto,
        expect.any(Object),
      );
    });
  });

  describe('Metadata Service Routing', () => {
    it('should route GET /api/v1/metadata/:id to Metadata service', async () => {
      const mockResponse = { id: '1', title: 'Metadata' };
      (proxyService.proxyToMetadata as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/metadata/1')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToMetadata).toHaveBeenCalledWith(
        'GET',
        '/metadata/1',
        null,
        expect.any(Object),
      );
    });
  });

  describe('Media Service Routing', () => {
    it('should route GET /api/v1/media/:id to Media service', async () => {
      const mockResponse = { id: '1', url: 'https://example.com/media.mp4' };
      (proxyService.proxyToMedia as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/media/1')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToMedia).toHaveBeenCalledWith(
        'GET',
        '/media/1',
        null,
        expect.any(Object),
      );
    });
  });

  describe('Ingest Service Routing', () => {
    it('should route GET /api/v1/ingest/jobs to Ingest service', async () => {
      const mockResponse = [{ id: '1', status: 'PENDING' }];
      (proxyService.proxyToIngest as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/ingest/jobs')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToIngest).toHaveBeenCalledWith(
        'GET',
        '/ingest/jobs',
        null,
        expect.any(Object),
      );
    });
  });
});
