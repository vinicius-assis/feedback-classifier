import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { openaiClientProvider } from './openai-client.provider';

@Module({
  imports: [ConfigModule],
  providers: [openaiClientProvider],
  exports: [openaiClientProvider],
})
export class ClassificationModule {}
