import type {
  FeedbackItem,
  FeedbackListResult,
  FeedbackStatsSummary,
} from '@feedback-classifier/shared';

export const API_BASE = 'http://localhost:3000/api';

export function makeFeedbackItem(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    _id: '65f0000000000000000000a1',
    rawText: 'The payments page is too slow',
    source: 'web_form',
    sentiment: 'negative',
    featureArea: 'payments',
    urgency: 'high',
    summary: 'Payments page performance complaint',
    model: 'gpt-4o-mini',
    promptVersion: 'v1',
    classificationStatus: 'success',
    createdAt: '2026-04-16T12:00:00.000Z',
    updatedAt: '2026-04-16T12:00:00.000Z',
    ...overrides,
  };
}

export function makeListResult(overrides: Partial<FeedbackListResult> = {}): FeedbackListResult {
  return {
    data: [
      makeFeedbackItem(),
      makeFeedbackItem({
        _id: '65f0000000000000000000a2',
        rawText: 'Love the new onboarding flow',
        source: 'web_bulk',
        sentiment: 'positive',
        featureArea: 'onboarding',
        urgency: 'low',
      }),
    ],
    total: 2,
    page: 1,
    limit: 20,
    ...overrides,
  };
}

export function makeStats(overrides: Partial<FeedbackStatsSummary> = {}): FeedbackStatsSummary {
  return {
    total: [{ count: 42 }],
    bySentiment: [
      { _id: 'positive', count: 20 },
      { _id: 'negative', count: 15 },
      { _id: 'neutral', count: 7 },
    ],
    byFeatureArea: [
      { _id: 'payments', count: 25 },
      { _id: 'onboarding', count: 17 },
    ],
    byUrgency: [
      { _id: 'high', count: 12 },
      { _id: 'low', count: 30 },
    ],
    bySource: [
      { _id: 'web_form', count: 30 },
      { _id: 'web_bulk', count: 12 },
    ],
    byClassificationStatus: [
      { _id: 'success', count: 40 },
      { _id: 'failed', count: 2 },
    ],
    ...overrides,
  };
}
