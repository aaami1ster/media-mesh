import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { SearchRepository } from '../repositories/search.repository';
import { SearchIndex } from '../entities/search-index.entity';
import { ContentType } from '@mediamesh/shared';
import { IndexContentDto } from '../dto/search.dto';

describe('SearchService', () => {
  let service: SearchService;
  let repository: jest.Mocked<SearchRepository>;

  const mockIndex: SearchIndex = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    contentId: '550e8400-e29b-41d4-a716-446655440002',
    contentType: ContentType.PROGRAM,
    title: 'Test Program',
    description: 'Test Description',
    category: 'MOVIE',
    language: 'en',
    tags: ['action', 'adventure'],
    indexedAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toDto: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository = {
      upsert: jest.fn(),
      findByContentId: jest.fn(),
      search: jest.fn(),
      delete: jest.fn(),
      getAllContentIds: jest.fn(),
      count: jest.fn(),
      getLastIndexedAt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: SearchRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    repository = module.get(SearchRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('indexContent', () => {
    it('should index content successfully', async () => {
      const indexDto: IndexContentDto = {
        contentId: mockIndex.contentId,
        contentType: ContentType.PROGRAM,
        title: 'Test Program',
        description: 'Test Description',
        category: 'MOVIE',
        language: 'en',
        tags: ['action'],
      };

      repository.upsert.mockResolvedValue(mockIndex);

      const result = await service.indexContent(indexDto);

      expect(result).toEqual(mockIndex);
      expect(repository.upsert).toHaveBeenCalledWith({
        contentId: indexDto.contentId,
        contentType: indexDto.contentType,
        title: indexDto.title,
        description: indexDto.description,
        category: indexDto.category,
        language: indexDto.language,
        tags: indexDto.tags,
      });
    });
  });

  describe('updateIndex', () => {
    it('should update search index', async () => {
      const updatedIndex = { ...mockIndex, title: 'Updated Title', toDto: jest.fn() };

      repository.findByContentId.mockResolvedValue(mockIndex);
      repository.upsert.mockResolvedValue(updatedIndex);

      const result = await service.updateIndex(mockIndex.contentId, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(repository.upsert).toHaveBeenCalled();
    });

    it('should throw error if content not found', async () => {
      repository.findByContentId.mockResolvedValue(null);

      await expect(
        service.updateIndex('non-existent', { title: 'Updated' }),
      ).rejects.toThrow();
    });
  });

  describe('deleteFromIndex', () => {
    it('should delete content from index', async () => {
      repository.delete.mockResolvedValue(undefined);

      await service.deleteFromIndex(mockIndex.contentId);

      expect(repository.delete).toHaveBeenCalledWith(mockIndex.contentId);
    });
  });

  describe('search', () => {
    it('should search content', async () => {
      const searchResult = {
        results: [mockIndex],
        total: 1,
      };

      repository.search.mockResolvedValue(searchResult);

      const result = await service.search('test', undefined, undefined, undefined, undefined, 1, 20);

      expect(result).toMatchObject({
        results: [mockIndex],
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(repository.search).toHaveBeenCalledWith(
        'test',
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        20,
      );
    });

    it('should apply filters', async () => {
      const searchResult = {
        results: [mockIndex],
        total: 1,
      };

      repository.search.mockResolvedValue(searchResult);

      await service.search('test', ContentType.PROGRAM, 'MOVIE', 'en', ['action'], 1, 20);

      expect(repository.search).toHaveBeenCalledWith(
        'test',
        ContentType.PROGRAM,
        'MOVIE',
        'en',
        ['action'],
        0,
        20,
      );
    });
  });

  describe('getIndexingStatus', () => {
    it('should return indexing status', async () => {
      repository.count.mockResolvedValue(100);
      repository.getLastIndexedAt.mockResolvedValue(new Date('2024-01-01'));

      const status = await service.getIndexingStatus();

      expect(status).toMatchObject({
        totalIndexed: 100,
        lastIndexedAt: expect.any(Date),
        indexingInProgress: false,
      });
    });
  });
});
