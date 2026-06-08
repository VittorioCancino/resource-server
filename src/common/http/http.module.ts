import { Module } from '@nestjs/common';
import { HttpFiltersModule } from './http-filters.module';
import { HttpInterceptorsModule } from './http-interceptors.module';
import { HttpMiddlewareModule } from './http-middleware.module';

@Module({
  imports: [HttpMiddlewareModule, HttpFiltersModule, HttpInterceptorsModule],
})
export class HttpModule {}
