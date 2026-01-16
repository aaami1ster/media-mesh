import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestJob, SourceType, IngestStatus } from '../entities/ingest-job.entity';

/**
 * Ingest Repository
 * 
 * Data access layer for IngestJob entities.
 */
@Injectable()
export class IngestRepository {
  private readonly logger = new Logger(IngestRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new ingest job
   */
  async create(data: {
    sourceType: SourceType;
    sourceUrl: string;
    metadata?: Record<string, any>;
  }): Promise<IngestJob> {
    const prismaJob = await this.prisma.ingestJob.create({
      data: {
        sourceType: data.sourceType,
        sourceUrl: data.sourceUrl,
        metadata: data.metadata,
        status: IngestStatus.PENDING,
        retryCount: 0,
      },
    });

    return IngestJob.fromPrisma(prismaJob);
  }

  /**
   * Find ingest job by ID
   */
  async findById(id: string): Promise<IngestJob | null> {
    const prismaJob = await this.prisma.ingestJob.findUnique({
      where: { id },
    });

    return prismaJob ? IngestJob.fromPrisma(prismaJob) : null;
  }

  /**
   * Find all ingest jobs with pagination
   */
  async findAll(
    status?: IngestStatus,
    sourceType?: SourceType,
    skip: number = 0,
    take: number = 20,
  ): Promise<{ jobs: IngestJob[]; total: number }> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (sourceType) {
      where.sourceType = sourceType;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.ingestJob.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ingestJob.count({ where }),
    ]);

    return {
      jobs: jobs.map(IngestJob.fromPrisma),
      total,
    };
  }

  /**
   * Find pending jobs
   */
  async findPendingJobs(limit: number = 10): Promise<IngestJob[]> {
    const jobs = await this.prisma.ingestJob.findMany({
      where: {
        status: IngestStatus.PENDING,
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    return jobs.map(IngestJob.fromPrisma);
  }

  /**
   * Update ingest job
   */
  async update(
    id: string,
    data: {
      status?: IngestStatus;
      contentId?: string;
      metadata?: Record<string, any>;
      errorMessage?: string;
      retryCount?: number;
    },
  ): Promise<IngestJob> {
    const prismaJob = await this.prisma.ingestJob.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.contentId !== undefined && { contentId: data.contentId }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        ...(data.errorMessage !== undefined && { errorMessage: data.errorMessage }),
        ...(data.retryCount !== undefined && { retryCount: data.retryCount }),
      },
    });

    return IngestJob.fromPrisma(prismaJob);
  }

  /**
   * Delete ingest job
   */
  async delete(id: string): Promise<void> {
    await this.prisma.ingestJob.delete({
      where: { id },
    });
  }

  /**
   * Count jobs by status
   */
  async countByStatus(status: IngestStatus): Promise<number> {
    return await this.prisma.ingestJob.count({
      where: { status },
    });
  }
}
