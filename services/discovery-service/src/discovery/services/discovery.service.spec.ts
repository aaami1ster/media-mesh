import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DiscoveryService } from './discovery.service';
import { DiscoveryRepository } from '../repositories/discovery.repository';
import { ContentType, ContentStatus } from '@mediamesh/shared';

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let repository: jest.Mocked<DiscoveryRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockProgram = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Program',
    description: 'Test Description',
    status: ContentStatus.PUBLISHED,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockEpisode = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    programId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Episode',
    episodeNumber: 1,
    status: ContentStatus.PUBLISHED,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockRepository = {
      search: jest.fn(),
      findPrograms: jest.fn(),
      findProgramById: jest.fn(),
      findEpisodesByProgramId: jest.fn(),
      findTrending: jest.fn(),
      findPopular: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        {
          provide: DiscoveryRepository,
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
    repository = module.get(DiscoveryRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should return cached results if available', async () => {
      const cachedResult = {
        programs: [mockProgram],
        episodes: [mockEpisode],
        total: 2,
        page: 1,
        limit: 20,
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.search('test', undefined, 1, 20);

      expect(result).toEqual(cachedResult);
      expect(cacheManager.get).toHaveBeenCalled();
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache miss', async () => {
      const dbResult = {
        programs: [mockProgram],
        episodes: [mockEpisode],
        total: 2,
      };

      cacheManager.get.mockResolvedValue(null);
      repository.search.mockResolvedValue(dbResult);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.search('test', undefined, 1, 20);

      expect(result).toMatchObject({
        ...dbResult,
        page: 1,
        limit: 20,
      });
      expect(repository.search).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getPrograms', () => {
    it('should return cached programs if available', async () => {
      const cachedResult = {
        programs: [mockProgram],
        total: 1,
        page: 1,
        limit: 20,
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getPrograms(undefined, 1, 20);

      expect(result).toEqual(cachedResult);
      expect(repository.findPrograms).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache miss', async () => {
      const dbResult = {
        programs: [mockProgram],
        total: 1,
      };

      cacheManager.get.mockResolvedValue(null);
      repository.findPrograms.mockResolvedValue(dbResult);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getPrograms(undefined, 1, 20);

      expect(result).toMatchObject({
        ...dbResult,
        page: 1,
        limit: 20,
      });
      expect(repository.findPrograms).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getProgram', () => {
    it('should return cached program if available', async () => {
      cacheManager.get.mockResolvedValue(mockProgram);

      const result = await service.getProgram(mockProgram.id);

      expect(result).toEqual(mockProgram);
      expect(repository.findProgramById).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache miss', async () => {
      cacheManager.get.mockResolvedValue(null);
      repository.findProgramById.mockResolvedValue(mockProgram);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getProgram(mockProgram.id);

      expect(result).toEqual(mockProgram);
      expect(repository.findProgramById).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should return null if program not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      repository.findProgramById.mockResolvedValue(null);

      const result = await service.getProgram('non-existent');

      expect(result).toBeNull();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('getEpisodes', () => {
    it('should return cached episodes if available', async () => {
      const cachedResult = {
        episodes: [mockEpisode],
        total: 1,
        page: 1,
        limit: 20,
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getEpisodes(mockProgram.id, 1, 20);

      expect(result).toEqual(cachedResult);
      expect(repository.findEpisodesByProgramId).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache miss', async () => {
      const dbResult = {
        episodes: [mockEpisode],
        total: 1,
      };

      cacheManager.get.mockResolvedValue(null);
      repository.findEpisodesByProgramId.mockResolvedValue(dbResult);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getEpisodes(mockProgram.id, 1, 20);

      expect(result).toMatchObject({
        ...dbResult,
        page: 1,
        limit: 20,
      });
      expect(repository.findEpisodesByProgramId).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getTrending', () => {
    it('should return cached trending if available', async () => {
      const cached = [mockProgram];
      cacheManager.get.mockResolvedValue(cached);

      const result = await service.getTrending(undefined, 10);

      expect(result).toEqual(cached);
      expect(repository.findTrending).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache miss', async () => {
      const dbResult = [mockProgram];

      cacheManager.get.mockResolvedValue(null);
      repository.findTrending.mockResolvedValue(dbResult);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getTrending(undefined, 10);

      expect(result).toEqual(dbResult);
      expect(repository.findTrending).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getPopular', () => {
    it('should return cached popular if available', async () => {
      const cached = [mockProgram];
      cacheManager.get.mockResolvedValue(cached);

      const result = await service.getPopular(undefined, 10);

      expect(result).toEqual(cached);
      expect(repository.findPopular).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache miss', async () => {
      const dbResult = [mockProgram];

      cacheManager.get.mockResolvedValue(null);
      repository.findPopular.mockResolvedValue(dbResult);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getPopular(undefined, 10);

      expect(result).toEqual(dbResult);
      expect(repository.findPopular).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('invalidateProgramCache', () => {
    it('should invalidate program cache', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidateProgramCache(mockProgram.id);

      expect(cacheManager.del).toHaveBeenCalled();
    });
  });
});
