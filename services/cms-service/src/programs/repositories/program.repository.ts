import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Program } from '../entities/program.entity';
import { ContentStatus } from '@mediamesh/shared';

/**
 * Program Repository
 * 
 * Data access layer for Program entities.
 */
@Injectable()
export class ProgramRepository {
  private readonly logger = new Logger(ProgramRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new program
   */
  async create(data: {
    title: string;
    description?: string;
    status?: ContentStatus;
    metadataId?: string;
    publishedAt?: Date;
  }): Promise<Program> {
    const prismaProgram = await this.prisma.program.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || ContentStatus.DRAFT,
        metadataId: data.metadataId,
        publishedAt: data.publishedAt,
      },
    });

    return Program.fromPrisma(prismaProgram);
  }

  /**
   * Find program by ID
   */
  async findById(id: string): Promise<Program | null> {
    const prismaProgram = await this.prisma.program.findUnique({
      where: { id },
    });

    return prismaProgram ? Program.fromPrisma(prismaProgram) : null;
  }

  /**
   * Find all programs with pagination
   */
  async findAll(skip: number = 0, take: number = 20): Promise<Program[]> {
    const prismaPrograms = await this.prisma.program.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return prismaPrograms.map(Program.fromPrisma);
  }

  /**
   * Find programs by status
   */
  async findByStatus(status: ContentStatus, skip: number = 0, take: number = 20): Promise<Program[]> {
    const prismaPrograms = await this.prisma.program.findMany({
      where: { status },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return prismaPrograms.map(Program.fromPrisma);
  }

  /**
   * Update program
   */
  async update(id: string, data: {
    title?: string;
    description?: string;
    status?: ContentStatus;
    metadataId?: string;
    publishedAt?: Date;
  }): Promise<Program> {
    const prismaProgram = await this.prisma.program.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.metadataId !== undefined && { metadataId: data.metadataId }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt }),
      },
    });

    return Program.fromPrisma(prismaProgram);
  }

  /**
   * Delete program
   */
  async delete(id: string): Promise<void> {
    await this.prisma.program.delete({
      where: { id },
    });
  }

  /**
   * Count programs
   */
  async count(): Promise<number> {
    return await this.prisma.program.count();
  }

  /**
   * Count programs by status
   */
  async countByStatus(status: ContentStatus): Promise<number> {
    return await this.prisma.program.count({
      where: { status },
    });
  }
}
