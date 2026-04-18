import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const configService = app.get(ConfigService);
  const portRaw = configService.get<string | number>('PORT');
  const port =
    typeof portRaw === 'number' ? portRaw : Number.parseInt(String(portRaw ?? ''), 10) || 3000;
  await app.listen(port);
}

void bootstrap();
