import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RequestAuditContextInterceptor } from './request-audit-context.interceptor';
import { RequestAuditExceptionFilter } from './request-audit-exception.filter';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import { RequestLoggingService } from './request-logging.service';

@Module({
  imports: [PrismaModule],
  providers: [
    RequestLoggingMiddleware,
    RequestLoggingService,
    RequestAuditExceptionFilter,
    RequestAuditContextInterceptor,
  ],
  exports: [
    RequestLoggingMiddleware,
    RequestLoggingService,
    RequestAuditExceptionFilter,
    RequestAuditContextInterceptor,
  ],
})
export class LoggingModule {}
