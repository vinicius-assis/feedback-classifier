import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ClassificationService.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly config: ConfigService,
  ) {}

  async classify(rawText: string): Promise<ClassificationResult> {
    return this.attempt(rawText, 0);
  }

  private async attempt(rawText: string, tries: number): Promise<ClassificationResult> {
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
      if (tries < 1 && this.isRetryable(err)) {
        this.logger.warn('Classification failed; retrying once.');
        return this.attempt(rawText, tries + 1);
      }
      throw new ClassificationError(
        err instanceof Error ? err.message : 'Classification failed',
        err,
      );
    }
  }

  private isRetryable(err: unknown): boolean {
    if (err instanceof SyntaxError) {
      return true;
    }
    if (err instanceof OpenAI.APIError) {
      const status = err.status;
      return status === 429 || (status !== undefined && status >= 500);
    }
    return false;
  }
}
