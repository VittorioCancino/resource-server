import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingModule } from '../logging/logging.module';
import { RequestAuditContextInterceptor } from '../logging/request-audit-context.interceptor';

@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestAuditContextInterceptor,
    },
  ],
})
export class HttpInterceptorsModule {}
