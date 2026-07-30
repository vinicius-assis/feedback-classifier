import type { FeedbackItem } from '@feedback-classifier/shared';

/**
 * Turns a freshly ingested item into the toast the ingest screens show:
 * a warning when the LLM step failed, otherwise a digest of what it inferred.
 */
export function classificationToast(data: FeedbackItem): {
  type: 'success' | 'warning';
  description: string;
} {
  if (data.classificationStatus === 'failed') {
    return { type: 'warning', description: 'Saved · Classification failed' };
  }
  if (data.classificationStatus === 'success') {
    const parts = [
      data.sentiment && data.sentiment !== 'unknown' ? `Sentiment: ${data.sentiment}` : null,
      data.featureArea && data.featureArea !== 'unknown' ? `Area: ${data.featureArea}` : null,
      data.urgency && data.urgency !== 'unknown' ? `Urgency: ${data.urgency}` : null,
    ].filter(Boolean);
    return {
      type: 'success',
      description: parts.length > 0 ? parts.join(' · ') : 'Classification complete',
    };
  }
  return { type: 'success', description: 'Saved' };
}
