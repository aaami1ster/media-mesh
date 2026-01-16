import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { ProxyService } from '../proxy.service';
import { ThrottlerIPGuard } from '../../throttler/throttler-ip.guard';

describe('SearchController', () => {
  let controller: SearchController;
  let proxyService: jest.Mocked<ProxyService>;

  beforeEach(async () => {
    const mockProxyService = {
      proxyToSearch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
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

    controller = module.get<SearchController>(SearchController);
    proxyService = module.get(ProxyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should proxy search request to Search service', async () => {
      const mockResponse = {
        results: [{ id: '1', title: 'Test' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      proxyService.proxyToSearch.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.search({ q: 'test' }, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToSearch).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('q=test'),
        null,
        expect.any(Object),
      );
    });

    it('should include query parameters', async () => {
      const mockResponse = { results: [], total: 0 };
      proxyService.proxyToSearch.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      await controller.search(
        { q: 'test', contentType: 'PROGRAM', page: 1, limit: 10 },
        mockRequest,
      );

      expect(proxyService.proxyToSearch).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('q=test'),
        null,
        expect.any(Object),
      );
    });
  });
});
