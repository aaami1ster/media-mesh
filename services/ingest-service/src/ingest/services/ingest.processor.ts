import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IngestService } from './ingest.service';
import { IngestRepository } from '../repositories/ingest.repository';
import { IngestStatus } from '../entities/ingest-job.entity';
import { INGEST_CONFIG } from '../../config/env.constants';

/**
 * Ingest Processor
 * 
 * Scheduled task processor for pending ingest jobs.
 */
@Injectable()
export class IngestProcessor {
  private readonly logger = new Logger(IngestProcessor.name);

  constructor(
    private readonly ingestService: IngestService,
    private readonly repository: IngestRepository,
  ) {}

  /**
   * Process pending jobs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingJobs() {
    this.logger.debug('Processing pending ingest jobs...');

    try {
      const pendingJobs = await this.repository.findPendingJobs(INGEST_CONFIG.BATCH_SIZE);

      if (pendingJobs.length === 0) {
        this.logger.debug('No pending jobs to process');
        return;
      }

      this.logger.log(`Processing ${pendingJobs.length} pending jobs`);

      // Process jobs in parallel (with concurrency limit)
      const promises = pendingJobs.map((job) =>
        this.ingestService.processJob(job.id).catch((error) => {
          this.logger.error(`Failed to process job ${job.id}:`, error);
        }),
      );

      await Promise.all(promises);
    } catch (error) {
      this.logger.error('Error processing pending jobs:', error);
    }
  }
}
