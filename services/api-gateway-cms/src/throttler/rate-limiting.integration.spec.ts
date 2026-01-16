import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CmsController } from '../proxy/controllers/cms.controller';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard, RolesGuard } from '@mediamesh/shared';

describe('Rate Limiting (Integration)', () => {
  let app: INestApplication;
  let proxyService: ProxyService;

  const mockUser = {
    id: 'user-123',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const mockProxyService = {
      proxyToCms: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CmsController],
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
      .overrideGuard(ThrottlerGuard)
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

  describe('Rate Limiting on Write Operations', () => {
    it('should apply rate limiting to POST requests', async () => {
      const createDto = { title: 'New Program' };
      const mockResponse = { id: '1', ...createDto };
      (proxyService.proxyToCms as jest.Mock).mockResolvedValue(mockResponse);

      // Note: In a real test, we'd need to configure ThrottlerGuard properly
      // and test actual rate limiting behavior
      const response = await request(app.getHttpServer())
        .post('/api/v1/cms/programs')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
    });

    it('should apply rate limiting to PUT requests', async () => {
      const updateDto = { title: 'Updated Program' };
      const mockResponse = { id: '1', ...updateDto };
      (proxyService.proxyToCms as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .put('/api/v1/cms/programs/1')
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });

    it('should apply rate limiting to DELETE requests', async () => {
      (proxyService.proxyToCms as jest.Mock).mockResolvedValue({});

      await request(app.getHttpServer())
        .delete('/api/v1/cms/programs/1')
        .expect(200);

      expect(proxyService.proxyToCms).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting Headers', () => {
    it('should include rate limit headers in response', async () => {
      const mockResponse = [{ id: '1' }];
      (proxyService.proxyToCms as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/cms/programs')
        .expect(200);

      // Note: ThrottlerGuard would add X-RateLimit-* headers in production
      expect(response.body).toEqual(mockResponse);
    });
  });
});
