import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 8086;
  await app.listen(port);
  console.log(`Auth Service is running on: http://localhost:${port}`);
}
bootstrap();
