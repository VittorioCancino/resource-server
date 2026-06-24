import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { adminUsersOpenApiDocument } from './openapi/admin-users.openapi';

function setupOpenApi(app: NestFastifyApplication) {
  SwaggerModule.setup('docs', app, adminUsersOpenApiDocument, {
    jsonDocumentUrl: 'openapi.json',
    customSiteTitle: 'Resource Server API Docs',
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
  app.useGlobalPipes(new ValidationPipe());
  setupOpenApi(app);
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
