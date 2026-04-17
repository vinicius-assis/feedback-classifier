import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        SLACK_INGEST_SECRET: Joi.string().required(),
        CORS_ORIGIN: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
    }),
    HealthModule,
  ],
})
export class AppModule {}
