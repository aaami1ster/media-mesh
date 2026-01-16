import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProgramRepository } from './repositories/program.repository';
import { ProgramService } from './services/program.service';
import { ProgramsController } from './controllers/programs.controller';
import { JWT_CONFIG } from '../config/env.constants';

/**
 * Programs Module
 * 
 * Provides program management functionality.
 */
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_CONFIG.SECRET,
      signOptions: {
        expiresIn: JWT_CONFIG.EXPIRATION_STRING,
      },
    }),
  ],
  controllers: [ProgramsController],
  providers: [ProgramRepository, ProgramService],
  exports: [ProgramRepository, ProgramService],
})
export class ProgramsModule {}
