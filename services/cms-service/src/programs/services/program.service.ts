import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ProgramRepository } from '../repositories/program.repository';
import { Program } from '../entities/program.entity';
import { ContentStatus } from '@mediamesh/shared';
import { throwIfNotFound } from '@mediamesh/shared';
import { KafkaService } from '../../kafka/kafka.service';

/**
 * Program Service
 * 
 * Business logic layer for program operations.
 * Handles validation, publishing workflow, and business rules.
 */
@Injectable()
export class ProgramService {
  private readonly logger = new Logger(ProgramService.name);

  constructor(
    private readonly programRepository: ProgramRepository,
    private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Create a new program
   */
  async create(data: {
    title: string;
    description?: string;
    status?: ContentStatus;
    metadataId?: string;
  }): Promise<Program> {
    this.logger.log(`Creating new program: ${data.title}`);

    // Validate status
    const status = data.status || ContentStatus.DRAFT;

    // Create program
    const program = await this.programRepository.create({
      title: data.title,
      description: data.description,
      status,
      metadataId: data.metadataId, // Optional FK to metadata service
      publishedAt: status === ContentStatus.PUBLISHED ? new Date() : undefined,
    });

    this.logger.log(`Program created: ${program.id} (${program.title})`);

    // Emit content.created event
    await this.kafkaService.emitContentCreated({
      contentId: program.id,
      contentType: 'PROGRAM',
      title: program.title,
      description: program.description,
      status: program.status,
      metadataId: program.metadataId,
      createdAt: program.createdAt,
    });

    return program;
  }

  /**
   * Find all programs with pagination
   */
  async findAll(skip: number = 0, take: number = 20): Promise<Program[]> {
    return await this.programRepository.findAll(skip, take);
  }

  /**
   * Find program by ID
   */
  async findOne(id: string): Promise<Program> {
    const program = await this.programRepository.findById(id);
    throwIfNotFound(program, 'Program', id);
    return program!;
  }

  /**
   * Find programs by status
   */
  async findByStatus(status: ContentStatus, skip: number = 0, take: number = 20): Promise<Program[]> {
    return await this.programRepository.findByStatus(status, skip, take);
  }

  /**
   * Update program
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: ContentStatus;
      metadataId?: string;
    },
  ): Promise<Program> {
    this.logger.log(`Updating program: ${id}`);

    // Check if program exists
    const existingProgram = await this.findOne(id);

    // Track changes for event
    const changes: Record<string, { old: any; new: any }> = {};
    if (data.title !== undefined && data.title !== existingProgram.title) {
      changes.title = { old: existingProgram.title, new: data.title };
    }
    if (data.description !== undefined && data.description !== existingProgram.description) {
      changes.description = { old: existingProgram.description, new: data.description };
    }
    if (data.status !== undefined && data.status !== existingProgram.status) {
      changes.status = { old: existingProgram.status, new: data.status };
    }
    if (data.metadataId !== undefined && data.metadataId !== existingProgram.metadataId) {
      changes.metadataId = { old: existingProgram.metadataId, new: data.metadataId };
    }

    // Validate status transition
    if (data.status) {
      this.validateStatusTransition(existingProgram.status, data.status);
    }

    // If publishing, set publishedAt
    let publishedAt = existingProgram.publishedAt;
    if (data.status === ContentStatus.PUBLISHED && !publishedAt) {
      publishedAt = new Date();
    } else if (data.status === ContentStatus.DRAFT && publishedAt) {
      // Don't clear publishedAt when unpublishing, keep history
      publishedAt = publishedAt;
    }

    // Update program
    const program = await this.programRepository.update(id, {
      title: data.title,
      description: data.description,
      status: data.status,
      metadataId: data.metadataId, // Metadata updates handled separately
      publishedAt,
    });

    this.logger.log(`Program updated: ${id}`);

    // Emit content.updated event if there were changes
    if (Object.keys(changes).length > 0) {
      await this.kafkaService.emitContentUpdated({
        contentId: program.id,
        contentType: 'PROGRAM',
        title: program.title,
        changes,
        program: {
          id: program.id,
          title: program.title,
          description: program.description,
          status: program.status,
          metadataId: program.metadataId,
          createdAt: program.createdAt.toISOString(),
          updatedAt: program.updatedAt.toISOString(),
          publishedAt: program.publishedAt?.toISOString(),
        },
      });
    }

    return program;
  }

  /**
   * Delete program
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting program: ${id}`);

    // Check if program exists
    await this.findOne(id);

    // Delete program (cascade will delete episodes)
    await this.programRepository.delete(id);

    this.logger.log(`Program deleted: ${id}`);
  }

  /**
   * Publish program (DRAFT -> PUBLISHED)
   */
  async publish(id: string): Promise<Program> {
    this.logger.log(`Publishing program: ${id}`);

    const program = await this.findOne(id);

    // Validate current status
    if (program.status === ContentStatus.PUBLISHED) {
      throw new ConflictException(`Program ${id} is already published`);
    }

    if (program.status !== ContentStatus.DRAFT) {
      throw new BadRequestException(`Cannot publish program with status: ${program.status}`);
    }

    // Publish program
    const publishedProgram = await this.programRepository.update(id, {
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    });

    this.logger.log(`Program published: ${id}`);

    // Emit content.published event
    await this.kafkaService.emitContentPublished({
      contentId: publishedProgram.id,
      contentType: 'PROGRAM',
      title: publishedProgram.title,
      publishedAt: publishedProgram.publishedAt!,
      program: {
        id: publishedProgram.id,
        title: publishedProgram.title,
        description: publishedProgram.description,
        status: publishedProgram.status,
        metadataId: publishedProgram.metadataId,
        createdAt: publishedProgram.createdAt.toISOString(),
        updatedAt: publishedProgram.updatedAt.toISOString(),
        publishedAt: publishedProgram.publishedAt?.toISOString(),
      },
    });

    return publishedProgram;
  }

  /**
   * Unpublish program (PUBLISHED -> DRAFT)
   */
  async unpublish(id: string): Promise<Program> {
    this.logger.log(`Unpublishing program: ${id}`);

    const program = await this.findOne(id);

    // Validate current status
    if (program.status === ContentStatus.DRAFT) {
      throw new ConflictException(`Program ${id} is already in draft status`);
    }

    if (program.status !== ContentStatus.PUBLISHED) {
      throw new BadRequestException(`Cannot unpublish program with status: ${program.status}`);
    }

    // Unpublish program (keep publishedAt for history)
    const unpublishedProgram = await this.programRepository.update(id, {
      status: ContentStatus.DRAFT,
      // Don't clear publishedAt - keep it for history
    });

    this.logger.log(`Program unpublished: ${id}`);
    return unpublishedProgram;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: ContentStatus, newStatus: ContentStatus): void {
    // Allow same status
    if (currentStatus === newStatus) {
      return;
    }

    // Valid transitions:
    // DRAFT -> PUBLISHED (via publish method)
    // PUBLISHED -> DRAFT (via unpublish method)
    // Any -> same (no-op)

    // Direct status updates should only allow DRAFT <-> PUBLISHED
    const validTransitions = [
      { from: ContentStatus.DRAFT, to: ContentStatus.PUBLISHED },
      { from: ContentStatus.PUBLISHED, to: ContentStatus.DRAFT },
    ];

    const isValid = validTransitions.some(
      (transition) => transition.from === currentStatus && transition.to === newStatus,
    );

    if (!isValid) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Use publish() or unpublish() methods.`,
      );
    }
  }

  /**
   * Count programs
   */
  async count(): Promise<number> {
    return await this.programRepository.count();
  }

  /**
   * Count programs by status
   */
  async countByStatus(status: ContentStatus): Promise<number> {
    return await this.programRepository.countByStatus(status);
  }
}
