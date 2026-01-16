import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBDiscoveryRepository } from './dynamodb-discovery.repository';
import { DynamoDBService } from '@mediamesh/shared';
import { DYNAMODB_CONFIG, REDIS_CONFIG } from '../../config/env.constants';
import { ContentType } from '@mediamesh/shared';

describe('DynamoDBDiscoveryRepository', () => {
  let repository: DynamoDBDiscoveryRepository;
  let dynamoDBService: jest.Mocked<DynamoDBService>;

  beforeEach(async () => {
    const mockDynamoDBService = {
      ensureTable: jest.fn(),
      putItem: jest.fn(),
      getItem: jest.fn(),
      query: jest.fn(),
      deleteItem: jest.fn(),
      batchWrite: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamoDBDiscoveryRepository,
        {
          provide: DynamoDBService,
          useValue: mockDynamoDBService,
        },
      ],
    }).compile();

    repository = module.get<DynamoDBDiscoveryRepository>(
      DynamoDBDiscoveryRepository,
    );
    dynamoDBService = module.get(DynamoDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create tables on initialization', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      dynamoDBService.ensureTable.mockRejectedValueOnce({
        name: 'ResourceNotFoundException',
      });
      dynamoDBService.ensureTable.mockResolvedValueOnce(undefined);
      dynamoDBService.ensureTable.mockResolvedValueOnce(undefined);

      await repository.onModuleInit();

      expect(dynamoDBService.ensureTable).toHaveBeenCalledTimes(2);
    });

    it('should skip table creation if DynamoDB is disabled', async () => {
      DYNAMODB_CONFIG.ENABLED = false;

      await repository.onModuleInit();

      expect(dynamoDBService.ensureTable).not.toHaveBeenCalled();
    });
  });

  describe('storeTrending', () => {
    it('should store trending items in DynamoDB', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      const items = [
        { id: '1', title: 'Program 1' },
        { id: '2', title: 'Program 2' },
      ];
      dynamoDBService.query.mockResolvedValueOnce([]);

      await repository.storeTrending(ContentType.PROGRAM, items, 600);

      expect(dynamoDBService.putItem).toHaveBeenCalledTimes(2);
      expect(dynamoDBService.putItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contentType: ContentType.PROGRAM,
          rank: 1,
        }),
        600,
      );
    });

    it('should not store if DynamoDB is disabled', async () => {
      DYNAMODB_CONFIG.ENABLED = false;

      await repository.storeTrending(ContentType.PROGRAM, [], 600);

      expect(dynamoDBService.putItem).not.toHaveBeenCalled();
    });
  });

  describe('getTrending', () => {
    it('should retrieve trending items from DynamoDB', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      const mockItems = [
        {
          contentType: ContentType.PROGRAM,
          rank: 1,
          data: JSON.stringify({ id: '1', title: 'Program 1' }),
        },
      ];
      dynamoDBService.query.mockResolvedValueOnce(mockItems);

      const result = await repository.getTrending(ContentType.PROGRAM, 10);

      expect(result).toBeDefined();
      expect(result?.length).toBe(1);
      expect(dynamoDBService.query).toHaveBeenCalled();
    });

    it('should return null if DynamoDB is disabled', async () => {
      DYNAMODB_CONFIG.ENABLED = false;

      const result = await repository.getTrending(ContentType.PROGRAM, 10);

      expect(result).toBeNull();
    });
  });

  describe('storePopular', () => {
    it('should store popular items in DynamoDB', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      const items = [{ id: '1', title: 'Program 1' }];
      dynamoDBService.query.mockResolvedValueOnce([]);

      await repository.storePopular(ContentType.PROGRAM, items, 300);

      expect(dynamoDBService.putItem).toHaveBeenCalled();
    });
  });

  describe('getPopular', () => {
    it('should retrieve popular items from DynamoDB', async () => {
      DYNAMODB_CONFIG.ENABLED = true;
      const mockItems = [
        {
          contentType: ContentType.PROGRAM,
          rank: 1,
          data: JSON.stringify({ id: '1', title: 'Program 1' }),
        },
      ];
      dynamoDBService.query.mockResolvedValueOnce(mockItems);

      const result = await repository.getPopular(ContentType.PROGRAM, 10);

      expect(result).toBeDefined();
      expect(dynamoDBService.query).toHaveBeenCalled();
    });
  });
});
