import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { SERVER_CONFIG } from './config/env.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const port = SERVER_CONFIG.PORT;
  await app.listen(port, '0.0.0.0');
  console.log(`CMS Service is running on: http://localhost:${port}`);
}
bootstrap();
