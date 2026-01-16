import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { CmsController } from './cms.controller';
import { ProxyService } from '../proxy.service';
import { JwtAuthGuard, RolesGuard } from '@mediamesh/shared';

describe('CmsController (integration)', () => {
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
      .compile();

    app = moduleFixture.createNestApplication(new FastifyAdapter());
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

  describe('GET /api/v1/cms/programs', () => {
    it('should proxy GET request to CMS service', async () => {
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
  });

  describe('POST /api/v1/cms/programs', () => {
    it('should proxy POST request to CMS service', async () => {
      const createDto = { title: 'New Program', description: 'Description' };
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

  describe('PUT /api/v1/cms/programs/:id', () => {
    it('should proxy PUT request to CMS service', async () => {
      const updateDto = { title: 'Updated Program' };
      const mockResponse = { id: '1', ...updateDto };
      (proxyService.proxyToCms as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .put('/api/v1/cms/programs/1')
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'PUT',
        '/programs/1',
        updateDto,
        expect.any(Object),
      );
    });
  });

  describe('DELETE /api/v1/cms/programs/:id', () => {
    it('should proxy DELETE request to CMS service', async () => {
      (proxyService.proxyToCms as jest.Mock).mockResolvedValue({});

      await request(app.getHttpServer())
        .delete('/api/v1/cms/programs/1')
        .expect(200);

      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'DELETE',
        '/programs/1',
        null,
        expect.any(Object),
      );
    });
  });
});
