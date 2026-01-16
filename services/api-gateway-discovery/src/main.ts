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
    .setTitle('MediaMesh Discovery API Gateway')
    .setDescription(
      `API Gateway for Discovery and Search Services with REST and GraphQL support.
      
## Features
- **REST API**: Traditional REST endpoints for discovery and search
- **GraphQL API**: Flexible GraphQL queries with filtering, pagination, and sorting
- **Public Access**: Most endpoints are public (no authentication required)
- **Optional Authentication**: JWT authentication for personalized features
- **Rate Limiting**: Redis-based rate limiting to prevent abuse
- **Resilience**: Automatic retry, circuit breaker, and timeout protection

## Rate Limits
- **Public (IP-based)**: 100 requests/minute
- **Authenticated (User-based)**: 200 requests/minute
- **Search endpoints**: 60 requests/minute (stricter due to expensive operations)

## GraphQL
Access GraphQL Playground at: /graphql

## REST API
All REST endpoints are versioned: /api/v1/...

## Resilience
- Automatic retry with exponential backoff
- Circuit breaker pattern for service protection
- 30-second timeout on all requests`,
    )
    .setVersion('1.0')
    .setContact('MediaMesh Team', 'https://mediamesh.example.com', 'support@mediamesh.example.com')
    .addServer('http://localhost:8080', 'Development server')
    .addServer('https://api.mediamesh.example.com', 'Production server')
    .addTag('Discovery', 'Content discovery endpoints - Browse programs and episodes')
    .addTag('Search', 'Search endpoints - Search content')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Optional JWT token for personalized features',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'MediaMesh Discovery API Gateway',
  });

  const port = SERVER_CONFIG.PORT;
  await app.listen(port, '0.0.0.0');
  console.log(`Discovery API Gateway is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  console.log(`GraphQL Playground available at: http://localhost:${port}/graphql`);
}
bootstrap();
