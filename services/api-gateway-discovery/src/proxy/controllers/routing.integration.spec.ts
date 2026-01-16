import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { SearchController } from './search.controller';
import { ProxyService } from '../proxy.service';

describe('API Gateway Routing (Integration)', () => {
  let app: INestApplication;
  let proxyService: ProxyService;

  beforeEach(async () => {
    const mockProxyService = {
      proxyToDiscovery: jest.fn(),
      proxyToSearch: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DiscoveryController, SearchController],
      providers: [
        {
          provide: ProxyService,
          useValue: mockProxyService,
        },
      ],
    }).compile();

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

  describe('Discovery Service Routing', () => {
    it('should route GET /api/v1/discovery/programs to Discovery service', async () => {
      const mockResponse = [{ id: '1', title: 'Test Program' }];
      (proxyService.proxyToDiscovery as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/discovery/programs')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });

    it('should route GET /api/v1/discovery/search to Discovery service', async () => {
      const mockResponse = {
        results: [{ id: '1', title: 'Test' }],
        total: 1,
      };
      (proxyService.proxyToDiscovery as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/discovery/search')
        .query({ q: 'test' })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });
  });

  describe('Search Service Routing', () => {
    it('should route GET /api/v1/search to Search service', async () => {
      const mockResponse = {
        results: [{ id: '1', title: 'Test' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      (proxyService.proxyToSearch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: 'test' })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToSearch).toHaveBeenCalled();
    });
  });
});
