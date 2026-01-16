import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBSearchRepository } from './dynamodb-search.repository';
import { DynamoDBService } from '@mediamesh/shared';
import { DYNAMODB_CONFIG } from '../../config/env.constants';
import { ContentType } from '@mediamesh/shared';

describe('DynamoDBSearchRepository', () => {
  let repository: DynamoDBSearchRepository;
  let dynamoDBService: jest.Mocked<DynamoDBService>;

  beforeEach(async () => {
    const mockDynamoDBService = {
      ensureTable: jest.fn(),
      putItem: jest.fn(),
      getItem: jest.fn(),
      query: jest.fn(),
      scan: jest.fn(),
      deleteItem: jest.fn(),
      batchWrite: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamoDBSearchRepository,
        {
          provide: DynamoDBService,
          useValue: mockDynamoDBService,
        },
      ],
    }).compile();

    repository = module.get<DynamoDBSearchRepository>(
      DynamoDBSearchRepository,
    );
    dynamoDBService = module.get(DynamoDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create search index table on initialization', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      dynamoDBService.ensureTable.mockRejectedValueOnce({
        name: 'ResourceNotFoundException',
      });
      dynamoDBService.ensureTable.mockResolvedValueOnce(undefined);

      await repository.onModuleInit();

      expect(dynamoDBService.ensureTable).toHaveBeenCalled();
    });
  });

  describe('upsert', () => {
    it('should upsert search index in DynamoDB', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      const data = {
        contentId: 'content-1',
        contentType: ContentType.PROGRAM,
        title: 'Test Program',
        description: 'Description',
      };

      const result = await repository.upsert(data);

      expect(dynamoDBService.putItem).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.contentId).toBe(data.contentId);
    });

    it('should return null if DynamoDB is disabled', async () => {
      DYNAMODB_CONFIG.ENABLED = false;

      const result = await repository.upsert({
        contentId: 'content-1',
        contentType: ContentType.PROGRAM,
        title: 'Test',
      });

      expect(result).toBeNull();
    });
  });

  describe('findByContentId', () => {
    it('should find item by content ID', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      const mockItem = {
        contentId: 'content-1',
        contentType: ContentType.PROGRAM,
        title: 'Test',
        indexedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dynamoDBService.getItem.mockResolvedValueOnce(mockItem);

      const result = await repository.findByContentId('content-1');

      expect(result).toBeDefined();
      expect(result?.contentId).toBe('content-1');
    });
  });

  describe('search', () => {
    it('should search in DynamoDB', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      const mockItems = [
        {
          contentId: 'content-1',
          contentType: ContentType.PROGRAM,
          title: 'Test Program',
          indexedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      dynamoDBService.query.mockResolvedValueOnce(mockItems);

      const result = await repository.search('test', ContentType.PROGRAM);

      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    it('should delete item from DynamoDB', async () => {
      DYNAMODB_CONFIG.ENABLED = true;

      await repository.delete('content-1');

      expect(dynamoDBService.deleteItem).toHaveBeenCalledWith(
        expect.any(String),
        { contentId: 'content-1' },
      );
    });
  });
});
