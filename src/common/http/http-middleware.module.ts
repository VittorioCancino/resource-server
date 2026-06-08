import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggingModule } from '../logging/logging.module';
import { RequestLoggingMiddleware } from '../logging/request-logging.middleware';

@Module({
  imports: [LoggingModule],
})
export class HttpMiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
