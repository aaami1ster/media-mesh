import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  DeleteItemCommand,
  UpdateItemCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand as DocQueryCommand,
  ScanCommand as DocScanCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB Service
 * 
 * Provides DynamoDB operations with automatic table creation and TTL support.
 * Supports both local DynamoDB (for development) and AWS DynamoDB (for production).
 */
@Injectable()
export class DynamoDBService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamoDBService.name);
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  constructor() {
    const config: any = {
      region: process.env.AWS_REGION || 'us-east-1',
    };

    // Use DynamoDB Local if endpoint is provided
    if (process.env.DYNAMODB_ENDPOINT) {
      config.endpoint = process.env.DYNAMODB_ENDPOINT;
      config.credentials = {
        accessKeyId: 'local',
        secretAccessKey: 'local',
      };
      this.logger.log(`Using DynamoDB Local at ${process.env.DYNAMODB_ENDPOINT}`);
    } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }

    this.client = new DynamoDBClient(config);
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  async onModuleInit() {
    this.logger.log('DynamoDB Service initialized');
  }

  async onModuleDestroy() {
    this.client.destroy();
  }

  /**
   * Create table if it doesn't exist
   */
  async ensureTable(
    tableName: string,
    partitionKey: string,
    sortKey?: string,
    gsiIndexes?: Array<{
      indexName: string;
      partitionKey: string;
      sortKey?: string;
    }>,
    ttlAttribute?: string,
  ): Promise<void> {
    try {
      // Check if table exists
      await this.client.send(
        new DescribeTableCommand({ TableName: tableName }),
      );
      this.logger.debug(`Table ${tableName} already exists`);
      return;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        // Table doesn't exist, create it
        this.logger.log(`Creating table ${tableName}...`);

        const attributeDefinitions: any[] = [
          {
            AttributeName: partitionKey,
            AttributeType: 'S',
          },
        ];

        const keySchema: any[] = [
          {
            AttributeName: partitionKey,
            KeyType: 'HASH',
          },
        ];

        if (sortKey) {
          attributeDefinitions.push({
            AttributeName: sortKey,
            AttributeType: 'S',
          });
          keySchema.push({
            AttributeName: sortKey,
            KeyType: 'RANGE',
          });
        }

        // Add GSI indexes
        const globalSecondaryIndexes = gsiIndexes?.map((gsi) => ({
          IndexName: gsi.indexName,
          KeySchema: [
            { AttributeName: gsi.partitionKey, KeyType: 'HASH' },
            ...(gsi.sortKey
              ? [{ AttributeName: gsi.sortKey, KeyType: 'RANGE' }]
              : []),
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        }));

        // Add GSI attribute definitions
        gsiIndexes?.forEach((gsi) => {
          if (
            !attributeDefinitions.find((a) => a.AttributeName === gsi.partitionKey)
          ) {
            attributeDefinitions.push({
              AttributeName: gsi.partitionKey,
              AttributeType: 'S',
            });
          }
          if (
            gsi.sortKey &&
            !attributeDefinitions.find((a) => a.AttributeName === gsi.sortKey)
          ) {
            attributeDefinitions.push({
              AttributeName: gsi.sortKey,
              AttributeType: 'S',
            });
          }
        });

        const tableParams: any = {
          TableName: tableName,
          AttributeDefinitions: attributeDefinitions,
          KeySchema: keySchema,
          BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
        };

        if (globalSecondaryIndexes && globalSecondaryIndexes.length > 0) {
          tableParams.GlobalSecondaryIndexes = globalSecondaryIndexes;
        }

        // Add TTL specification if provided
        if (ttlAttribute) {
          tableParams.TimeToLiveSpecification = {
            Enabled: true,
            AttributeName: ttlAttribute,
          };
        }

        await this.client.send(new CreateTableCommand(tableParams));
        this.logger.log(`Table ${tableName} created successfully`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Put item with TTL support
   */
  async putItem(
    tableName: string,
    item: Record<string, any>,
    ttlSeconds?: number,
  ): Promise<void> {
    const itemToPut = { ...item };

    // Add TTL if specified
    if (ttlSeconds) {
      const ttlAttribute = process.env.DYNAMODB_TTL_ATTRIBUTE || 'ttl';
      itemToPut[ttlAttribute] = Math.floor(Date.now() / 1000) + ttlSeconds;
    }

    await this.docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: itemToPut,
      }),
    );
  }

  /**
   * Get item by key
   */
  async getItem(
    tableName: string,
    key: Record<string, any>,
  ): Promise<Record<string, any> | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: key,
      }),
    );

    return result.Item || null;
  }

  /**
   * Query items
   */
  async query(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    indexName?: string,
    filterExpression?: string,
    limit?: number,
  ): Promise<Record<string, any>[]> {
    const params: any = {
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    if (indexName) {
      params.IndexName = indexName;
    }

    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }

    if (limit) {
      params.Limit = limit;
    }

    const result = await this.docClient.send(new DocQueryCommand(params));
    return result.Items || [];
  }

  /**
   * Scan table
   */
  async scan(
    tableName: string,
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
    limit?: number,
  ): Promise<Record<string, any>[]> {
    const params: any = {
      TableName: tableName,
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (limit) {
      params.Limit = limit;
    }

    const result = await this.docClient.send(new DocScanCommand(params));
    return result.Items || [];
  }

  /**
   * Update item
   */
  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
  ): Promise<void> {
    const params: any = {
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    if (expressionAttributeNames) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    await this.docClient.send(new UpdateCommand(params));
  }

  /**
   * Delete item
   */
  async deleteItem(
    tableName: string,
    key: Record<string, any>,
  ): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: key,
      }),
    );
  }

  /**
   * Batch write items
   */
  async batchWrite(
    tableName: string,
    items: Record<string, any>[],
    ttlSeconds?: number,
  ): Promise<void> {
    // DynamoDB batch write supports up to 25 items
    const batchSize = 25;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const requests = batch.map((item) => {
        const itemToPut = { ...item };
        if (ttlSeconds) {
          const ttlAttribute = process.env.DYNAMODB_TTL_ATTRIBUTE || 'ttl';
          itemToPut[ttlAttribute] = Math.floor(Date.now() / 1000) + ttlSeconds;
        }
        return {
          PutRequest: {
            Item: itemToPut,
          },
        };
      });

      // Note: For simplicity, using individual PutItem commands
      // For production, use BatchWriteItemCommand
      await Promise.all(
        requests.map((req) =>
          this.docClient.send(
            new PutCommand({
              TableName: tableName,
              Item: req.PutRequest.Item,
            }),
          ),
        ),
      );
    }
  }
}
