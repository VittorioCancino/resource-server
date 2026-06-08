import { Injectable, Logger } from '@nestjs/common';
import { safeDbCall } from '../errors/db-error';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRequestLogDto } from './dto/create-request-log.dto';

@Injectable()
export class RequestLoggingService {
  private readonly logger = new Logger(RequestLoggingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async write(data: CreateRequestLogDto): Promise<void> {
    const result = await safeDbCall(() =>
      this.prisma.apiRequestLog.create({ data }),
    );

    if (!result.ok) {
      this.logger.error('Failed to persist API request log', result.error);
    }
  }
}
