import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LabsController } from './labs.controller';
import { LabsService } from './labs.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [LabsController],
  providers: [LabsService],
  exports: [LabsService],
})
export class LabsModule {}
