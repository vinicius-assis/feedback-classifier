import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { openaiClientProvider } from './openai-client.provider';
import { ClassificationService } from './classification.service';

@Module({
  imports: [ConfigModule],
  providers: [openaiClientProvider, ClassificationService],
  exports: [openaiClientProvider, ClassificationService],
})
export class ClassificationModule {}
