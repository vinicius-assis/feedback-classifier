import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import {
  ClassificationOutput,
  OPENAI_CLIENT,
  PROMPT_VERSION,
  buildClassificationPrompt,
  classificationOutputSchema,
} from './classification.constants';

export class ClassificationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ClassificationError';
  }
}

export interface ClassificationResult {
  output: ClassificationOutput;
  /** Parsed JSON from the model before Zod coercion (for persistence as `classificationRaw`). */
  classificationRaw: unknown;
  model: string;
  promptVersion: typeof PROMPT_VERSION;
}

@Injectable()
export class ClassificationService {
  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly config: ConfigService,
  ) {}

  async classify(rawText: string): Promise<ClassificationResult> {
    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildClassificationPrompt(rawText) }],
      });

      const content = completion.choices[0]?.message?.content ?? '';
      const parsed: unknown = JSON.parse(content);
      const output = classificationOutputSchema.parse(parsed);

      return {
        output,
        classificationRaw: parsed,
        model,
        promptVersion: PROMPT_VERSION,
      };
    } catch (err) {
      throw new ClassificationError(
        err instanceof Error ? err.message : 'Classification failed',
        err,
      );
    }
  }
}
