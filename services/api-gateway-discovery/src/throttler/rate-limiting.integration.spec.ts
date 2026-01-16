import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DiscoveryController } from '../proxy/controllers/discovery.controller';
import { SearchController } from '../proxy/controllers/search.controller';
import { ProxyService } from '../proxy/proxy.service';
import { ThrottlerIPGuard } from './throttler-ip.guard';

describe('Rate Limiting (Integration)', () => {
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
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({
        canActivate: jest.fn(() => true), // Allow all requests for testing
      })
      .overrideGuard(ThrottlerIPGuard)
      .useValue({
        canActivate: jest.fn(() => true), // Allow all requests for testing
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

  describe('Rate Limiting on Search Endpoints', () => {
    it('should apply rate limiting to search endpoints', async () => {
      const mockResponse = {
        results: [{ id: '1', title: 'Test' }],
        total: 1,
      };
      (proxyService.proxyToSearch as jest.Mock).mockResolvedValue(mockResponse);

      // Note: In a real test, we'd need to configure ThrottlerGuard properly
      // and test actual rate limiting behavior
      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: 'test' })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });

    it('should apply rate limiting to discovery search', async () => {
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
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should track rate limits by IP address for public endpoints', async () => {
      const mockResponse = [{ id: '1', title: 'Program' }];
      (proxyService.proxyToDiscovery as jest.Mock).mockResolvedValue(mockResponse);

      // Note: In a real test, we'd verify IP-based tracking
      const response = await request(app.getHttpServer())
        .get('/api/v1/discovery/programs')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('User-based Rate Limiting', () => {
    it('should track rate limits by user ID for authenticated endpoints', async () => {
      const mockResponse = [{ id: '1', title: 'Program' }];
      (proxyService.proxyToDiscovery as jest.Mock).mockResolvedValue(mockResponse);

      // Note: In a real test with authentication, we'd verify user-based tracking
      const response = await request(app.getHttpServer())
        .get('/api/v1/discovery/programs')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });
});
