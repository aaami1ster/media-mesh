import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryController } from './discovery.controller';
import { ProxyService } from '../proxy.service';
import { ThrottlerIPGuard } from '../../throttler/throttler-ip.guard';

describe('DiscoveryController', () => {
  let controller: DiscoveryController;
  let proxyService: jest.Mocked<ProxyService>;

  beforeEach(async () => {
    const mockProxyService = {
      proxyToDiscovery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscoveryController],
      providers: [
        {
          provide: ProxyService,
          useValue: mockProxyService,
        },
      ],
    })
      .overrideGuard(ThrottlerIPGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<DiscoveryController>(DiscoveryController);
    proxyService = module.get(ProxyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should proxy search request to Discovery service', async () => {
      const mockResponse = {
        results: [{ id: '1', title: 'Test' }],
        total: 1,
      };
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
        ip: '127.0.0.1',
      } as any;

      const result = await controller.search({ q: 'test' }, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });
  });

  describe('getPrograms', () => {
    it('should proxy GET request for programs', async () => {
      const mockResponse = [{ id: '1', title: 'Program 1' }];
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getPrograms({}, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });
  });

  describe('getProgram', () => {
    it('should proxy GET request for specific program', async () => {
      const mockResponse = { id: '1', title: 'Program 1' };
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getProgram('1', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalledWith(
        'GET',
        '/discovery/programs/1',
        null,
        expect.any(Object),
      );
    });
  });

  describe('getEpisodes', () => {
    it('should proxy GET request for episodes', async () => {
      const mockResponse = [{ id: '1', title: 'Episode 1' }];
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getEpisodes('program-1', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalledWith(
        'GET',
        '/discovery/programs/program-1/episodes',
        null,
        expect.any(Object),
      );
    });
  });

  describe('getTrending', () => {
    it('should proxy GET request for trending content', async () => {
      const mockResponse = [{ id: '1', title: 'Trending Program' }];
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getTrending({}, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });
  });

  describe('getPopular', () => {
    it('should proxy GET request for popular content', async () => {
      const mockResponse = [{ id: '1', title: 'Popular Program' }];
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getPopular({}, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });
  });
});
