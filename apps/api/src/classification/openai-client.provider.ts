import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { OPENAI_CLIENT } from './classification.constants';

/** Injectable OpenAI SDK instance (timeout aligned with spec §6 — explicit HTTP timeout). */
export const openaiClientProvider: Provider = {
  provide: OPENAI_CLIENT,
  useFactory: (config: ConfigService) =>
    new OpenAI({
      apiKey: config.getOrThrow<string>('OPENAI_API_KEY'),
      timeout: 30_000,
    }),
  inject: [ConfigService],
};
