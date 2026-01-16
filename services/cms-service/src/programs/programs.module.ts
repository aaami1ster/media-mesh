import { Module } from '@nestjs/common';
import { ProgramRepository } from './repositories/program.repository';
import { ProgramService } from './services/program.service';

/**
 * Programs Module
 * 
 * Provides program management functionality.
 */
@Module({
  providers: [ProgramRepository, ProgramService],
  exports: [ProgramRepository, ProgramService],
})
export class ProgramsModule {}
