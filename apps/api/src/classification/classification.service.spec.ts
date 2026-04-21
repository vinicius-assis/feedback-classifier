import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { OPENAI_CLIENT, PROMPT_VERSION } from './classification.constants';
import { ClassificationError, ClassificationService } from './classification.service';

const makeCompletion = (content: string) => ({
  choices: [{ message: { content } }],
});

describe('ClassificationService', () => {
  let service: ClassificationService;
  let create: jest.Mock;

  beforeEach(async () => {
    create = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClassificationService,
        { provide: OPENAI_CLIENT, useValue: { chat: { completions: { create } } } },
        { provide: ConfigService, useValue: { get: () => 'gpt-4o-mini' } },
      ],
    }).compile();

    service = moduleRef.get(ClassificationService);
  });

  it('returns valid classification for well-formed JSON', async () => {
    create.mockResolvedValueOnce(
      makeCompletion(
        JSON.stringify({
          sentiment: 'positive',
          featureArea: 'payments',
          urgency: 'high',
          summary: 'ok',
        }),
      ),
    );
    const result = await service.classify('great payments feature');
    expect(result.output.sentiment).toBe('positive');
    expect(result.output.featureArea).toBe('payments');
    expect(result.promptVersion).toBe(PROMPT_VERSION);
  });

  it('coerces invalid enum value to unknown', async () => {
    create.mockResolvedValueOnce(
      makeCompletion(
        JSON.stringify({
          sentiment: 'INVALID',
          featureArea: 'payments',
          urgency: 'high',
          summary: '',
        }),
      ),
    );
    const result = await service.classify('some feedback');
    expect(result.output.sentiment).toBe('unknown');
  });

  it('retries once on transient APIError then throws ClassificationError', async () => {
    const serverErr = new OpenAI.APIError(503, undefined, 'unavailable', undefined);
    create.mockRejectedValue(serverErr);
    await expect(service.classify('test')).rejects.toThrow(ClassificationError);
    expect(create).toHaveBeenCalledTimes(2);
  });
});
