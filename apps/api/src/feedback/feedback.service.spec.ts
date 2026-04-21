import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { PROMPT_VERSION } from '../classification/classification.constants';
import { ClassificationError, ClassificationService } from '../classification/classification.service';
import { FeedbackService } from './feedback.service';
import { FeedbackItem } from './schemas/feedback-item.schema';

function makeMockModel() {
  const mockModel = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(undefined),
    set: jest.fn(),
  }));
  Object.assign(mockModel, {
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
  });
  return mockModel as jest.Mock & Record<string, jest.Mock>;
}

describe('FeedbackService', () => {
  let service: FeedbackService;
  let mockModel: ReturnType<typeof makeMockModel>;
  let classify: jest.Mock;

  beforeEach(async () => {
    mockModel = makeMockModel();
    classify = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getModelToken(FeedbackItem.name), useValue: mockModel },
        { provide: ClassificationService, useValue: { classify } },
      ],
    }).compile();

    service = moduleRef.get(FeedbackService);
  });

  it('ingest: on successful classify, persists doc with classificationStatus success and fields', async () => {
    classify.mockResolvedValue({
      output: {
        sentiment: 'positive',
        featureArea: 'payments',
        urgency: 'high',
        summary: 'ok',
      },
      classificationRaw: { sentiment: 'positive' },
      model: 'gpt-4o-mini',
      promptVersion: PROMPT_VERSION,
    });

    await service.ingest({ rawText: 'great feature', source: 'web_form' });

    const docInstance = mockModel.mock.results[0]!.value as {
      save: jest.Mock;
      set: jest.Mock;
      sentiment?: string;
      featureArea?: string;
      urgency?: string;
      summary?: string;
      classificationStatus?: string;
      promptVersion?: string;
    };

    expect(classify).toHaveBeenCalledWith('great feature');
    expect(docInstance.sentiment).toBe('positive');
    expect(docInstance.featureArea).toBe('payments');
    expect(docInstance.urgency).toBe('high');
    expect(docInstance.summary).toBe('ok');
    expect(docInstance.classificationStatus).toBe('success');
    expect(docInstance.promptVersion).toBe(PROMPT_VERSION);
    expect(docInstance.set).toHaveBeenCalledWith('model', 'gpt-4o-mini');
    expect(docInstance.save).toHaveBeenCalled();
  });

  it('ingest: on ClassificationError, persists doc with failed status and error message', async () => {
    classify.mockRejectedValue(new ClassificationError('LLM unavailable'));

    await service.ingest({ rawText: 'some text' });

    const docInstance = mockModel.mock.results[0]!.value as {
      save: jest.Mock;
      classificationStatus?: string;
      classificationError?: string;
    };

    expect(docInstance.classificationStatus).toBe('failed');
    expect(docInstance.classificationError).toBe('LLM unavailable');
    expect(docInstance.save).toHaveBeenCalled();
  });

  it('findById: returns document when found', async () => {
    const found = { _id: '507f1f77bcf86cd799439011', rawText: 'x' };
    mockModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(found),
    });

    const result = await service.findById('507f1f77bcf86cd799439011');
    expect(result).toBe(found);
    expect(mockModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('findById: throws NotFoundException when document is null', async () => {
    mockModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.findById('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
  });

  it('findById: throws NotFoundException on Mongoose CastError', async () => {
    const castErr = new Error('Cast to ObjectId failed');
    castErr.name = 'CastError';
    mockModel.findById.mockReturnValue({
      exec: jest.fn().mockRejectedValue(castErr),
    });

    await expect(service.findById('not-an-id')).rejects.toThrow(NotFoundException);
  });

  it('ingestBulk: mixed fulfilled and rejected items', async () => {
    classify
      .mockResolvedValueOnce({
        output: {
          sentiment: 'neutral',
          featureArea: 'other',
          urgency: 'low',
          summary: 'a',
        },
        classificationRaw: {},
        model: 'gpt-4o-mini',
        promptVersion: PROMPT_VERSION,
      })
      /** Non-ClassificationError is rethrown by persistFeedback → bulk row is rejected. */
      .mockRejectedValueOnce(new Error('unexpected failure'));

    const results = await service.ingestBulk([{ rawText: 'first' }, { rawText: 'second' }], 'web_bulk');

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ index: 0, status: 'fulfilled' });
    expect(results[1]).toMatchObject({
      index: 1,
      status: 'rejected',
      error: 'unexpected failure',
    });
    expect((results[0] as { status: string }).status === 'fulfilled' && 'data' in results[0]).toBe(true);
  });
});
