/**
 * Source Type Enum
 */
export enum SourceType {
  YOUTUBE = 'YOUTUBE',
  RSS = 'RSS',
  API = 'API',
}

/**
 * Ingest Status Enum
 */
export enum IngestStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Ingest Job Entity
 * 
 * Represents a content ingestion job.
 */
export class IngestJob {
  id: string;
  sourceType: SourceType;
  sourceUrl: string;
  status: IngestStatus;
  contentId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<IngestJob>) {
    Object.assign(this, partial);
  }

  /**
   * Create IngestJob entity from Prisma model
   */
  static fromPrisma(prismaJob: {
    id: string;
    sourceType: string;
    sourceUrl: string;
    status: string;
    contentId: string | null;
    metadata: any;
    errorMessage: string | null;
    retryCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): IngestJob {
    return new IngestJob({
      id: prismaJob.id,
      sourceType: prismaJob.sourceType as SourceType,
      sourceUrl: prismaJob.sourceUrl,
      status: prismaJob.status as IngestStatus,
      contentId: prismaJob.contentId || undefined,
      metadata: prismaJob.metadata || undefined,
      errorMessage: prismaJob.errorMessage || undefined,
      retryCount: prismaJob.retryCount,
      createdAt: prismaJob.createdAt,
      updatedAt: prismaJob.updatedAt,
    });
  }

  /**
   * Convert to DTO
   */
  toDto() {
    const { ...dto } = this;
    return dto;
  }
}
