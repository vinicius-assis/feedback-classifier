import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { ClassificationModule } from './classification/classification.module';
import { FeedbackModule } from './feedback/feedback.module';
import { HealthModule } from './health/health.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        SLACK_INGEST_SECRET: Joi.string().required(),
        CORS_ORIGIN: Joi.string().required(),
        OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
        PORT: Joi.number().default(3000),
      }),
    }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ClassificationModule,
    FeedbackModule,
    IntegrationsModule,
    HealthModule,
  ],
})
export class AppModule {}
