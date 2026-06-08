import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggingModule } from '../logging/logging.module';
import { RequestAuditExceptionFilter } from '../logging/request-audit-exception.filter';

@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: RequestAuditExceptionFilter,
    },
  ],
})
export class HttpFiltersModule {}
