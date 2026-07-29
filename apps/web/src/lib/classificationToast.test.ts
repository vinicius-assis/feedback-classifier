import { describe, expect, it } from 'vitest';

import { makeFeedbackItem } from '../test/fixtures';
import { classificationToast } from './classificationToast';

describe('classificationToast', () => {
  it('warns when classification failed', () => {
    const toast = classificationToast(makeFeedbackItem({ classificationStatus: 'failed' }));
    expect(toast.type).toBe('warning');
    expect(toast.description).toBe('Saved · Classification failed');
  });

  it('summarizes sentiment, area and urgency on success', () => {
    const toast = classificationToast(
      makeFeedbackItem({
        classificationStatus: 'success',
        sentiment: 'negative',
        featureArea: 'payments',
        urgency: 'high',
      }),
    );
    expect(toast.type).toBe('success');
    expect(toast.description).toBe('Sentiment: negative · Area: payments · Urgency: high');
  });

  it('omits fields the model could not determine', () => {
    const toast = classificationToast(
      makeFeedbackItem({
        classificationStatus: 'success',
        sentiment: 'positive',
        featureArea: 'unknown',
        urgency: 'unknown',
      }),
    );
    expect(toast.description).toBe('Sentiment: positive');
  });

  it('falls back when every classified field is unknown', () => {
    const toast = classificationToast(
      makeFeedbackItem({
        classificationStatus: 'success',
        sentiment: 'unknown',
        featureArea: 'unknown',
        urgency: 'unknown',
      }),
    );
    expect(toast.description).toBe('Classification complete');
  });

  it('reports a plain save when there is no classification status', () => {
    const toast = classificationToast(makeFeedbackItem({ classificationStatus: undefined }));
    expect(toast).toEqual({ type: 'success', description: 'Saved' });
  });
});
