import { Module } from '@nestjs/common';
import { ProgramRepository } from './repositories/program.repository';
import { ProgramService } from './services/program.service';
import { ProgramsController } from './controllers/programs.controller';

/**
 * Programs Module
 * 
 * Provides program management functionality.
 */
@Module({
  controllers: [ProgramsController],
  providers: [ProgramRepository, ProgramService],
  exports: [ProgramRepository, ProgramService],
})
export class ProgramsModule {}
