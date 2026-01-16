import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SERVER_CONFIG } from './config/env.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API versioning - URL-based
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('MediaMesh CMS API Gateway')
    .setDescription(
      `API Gateway for CMS, Metadata, Media, and Ingest Services.
      
## Features
- **Authentication**: JWT-based authentication with role-based access control (RBAC)
- **Rate Limiting**: Redis-based rate limiting with different limits for ADMIN and EDITOR roles
- **Resilience**: Automatic retry with exponential backoff, circuit breaker pattern, and timeout protection
- **API Versioning**: URL-based versioning (/api/v1/...)

## Authentication
Most endpoints require JWT authentication. Use the "Authorize" button to set your JWT token.

## Rate Limits
- **ADMIN**: 100 requests/minute
- **EDITOR**: 50 requests/minute
- **Default**: 20 requests/minute

## Service Endpoints
- **CMS Service**: Programs and Episodes management
- **Metadata Service**: Content metadata management
- **Media Service**: Media file upload and management
- **Ingest Service**: Content ingestion from external sources`,
    )
    .setVersion('1.0')
    .setContact('MediaMesh Team', 'https://mediamesh.example.com', 'support@mediamesh.example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:8081', 'Development server')
    .addServer('https://api.mediamesh.example.com', 'Production server')
    .addTag('CMS', 'Content Management System endpoints - Manage programs and episodes')
    .addTag('Metadata', 'Metadata management endpoints - Manage content metadata')
    .addTag('Media', 'Media upload and management endpoints - Upload and manage media files')
    .addTag('Ingest', 'Content ingestion endpoints - Ingest content from external sources')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token. Get token from /auth/login endpoint.',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'MediaMesh CMS API Gateway',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = SERVER_CONFIG.PORT;
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway CMS is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
