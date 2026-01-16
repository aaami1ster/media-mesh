import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryResolver } from './discovery.resolver';
import { ProxyService } from '../../proxy/proxy.service';
import { SearchArgs, ProgramsArgs, TrendingArgs } from '../dto/search-args.dto';

describe('DiscoveryResolver', () => {
  let resolver: DiscoveryResolver;
  let proxyService: jest.Mocked<ProxyService>;

  beforeEach(async () => {
    const mockProxyService = {
      proxyToDiscovery: jest.fn(),
      proxyToSearch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryResolver,
        {
          provide: ProxyService,
          useValue: mockProxyService,
        },
      ],
    }).compile();

    resolver = module.get<DiscoveryResolver>(DiscoveryResolver);
    proxyService = module.get(ProxyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrograms', () => {
    it('should return list of programs', async () => {
      const mockResponse = [
        { id: '1', title: 'Program 1' },
        { id: '2', title: 'Program 2' },
      ];
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const args: ProgramsArgs = { page: 1, limit: 20 };
      const context = { req: { headers: {} } };

      const result = await resolver.getPrograms(args, context);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });
  });

  describe('getProgram', () => {
    it('should return a specific program', async () => {
      const mockResponse = { id: '1', title: 'Program 1' };
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const context = { req: { headers: {} } };

      const result = await resolver.getProgram('1', context);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalledWith(
        'GET',
        '/discovery/programs/1',
        null,
        expect.any(Object),
      );
    });

    it('should return null if program not found', async () => {
      proxyService.proxyToDiscovery.mockResolvedValue(null);

      const context = { req: { headers: {} } };

      const result = await resolver.getProgram('999', context);

      expect(result).toBeNull();
    });
  });

  describe('getEpisodes', () => {
    it('should return episodes for a program', async () => {
      const mockResponse = [
        { id: '1', title: 'Episode 1', programId: 'program-1' },
        { id: '2', title: 'Episode 2', programId: 'program-1' },
      ];
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const context = { req: { headers: {} } };

      const result = await resolver.getEpisodes('program-1', context);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalledWith(
        'GET',
        '/discovery/programs/program-1/episodes',
        null,
        expect.any(Object),
      );
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const mockResponse = {
        results: [
          { id: '1', title: 'Program 1', contentType: 'PROGRAM' },
          { id: '2', title: 'Episode 1', contentType: 'EPISODE' },
        ],
        total: 2,
        page: 1,
        limit: 20,
      };
      proxyService.proxyToSearch.mockResolvedValue(mockResponse);

      const args: SearchArgs = {
        q: 'test',
        page: 1,
        limit: 20,
      };
      const context = { req: { headers: {} } };

      const result = await resolver.search(args, context);

      expect(result.programs).toHaveLength(1);
      expect(result.episodes).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(proxyService.proxyToSearch).toHaveBeenCalled();
    });
  });

  describe('getTrending', () => {
    it('should return trending programs', async () => {
      const mockResponse = [
        { id: '1', title: 'Trending Program 1' },
        { id: '2', title: 'Trending Program 2' },
      ];
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const args: TrendingArgs = { limit: 10 };
      const context = { req: { headers: {} } };

      const result = await resolver.getTrending(args, context);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });
  });

  describe('getPopular', () => {
    it('should return popular programs', async () => {
      const mockResponse = [
        { id: '1', title: 'Popular Program 1' },
        { id: '2', title: 'Popular Program 2' },
      ];
      proxyService.proxyToDiscovery.mockResolvedValue(mockResponse);

      const args: TrendingArgs = { limit: 10 };
      const context = { req: { headers: {} } };

      const result = await resolver.getPopular(args, context);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToDiscovery).toHaveBeenCalled();
    });
  });
});
