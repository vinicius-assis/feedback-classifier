import type {
  ClassificationStatus,
  FeatureArea,
  FeedbackSource,
  Sentiment,
  Urgency,
} from './types';

/**
 * The values the dashboard offers as filters. Also used to validate query
 * params, so a hand-edited URL cannot push a bogus value into the API call.
 */
export const SENTIMENT_OPTIONS: readonly Sentiment[] = [
  'positive',
  'neutral',
  'negative',
  'unknown',
];

export const FEATURE_AREA_OPTIONS: readonly FeatureArea[] = [
  'onboarding',
  'payments',
  'reporting',
  'performance',
  'security',
  'integrations',
  'other',
  'unknown',
];

export const URGENCY_OPTIONS: readonly Urgency[] = ['low', 'medium', 'high', 'unknown'];

/** `slack_like` is intentionally absent: the web app does not ingest from Slack. */
export const SOURCE_OPTIONS: readonly FeedbackSource[] = ['web_form', 'web_bulk', 'web_file'];

export const CLASSIFICATION_STATUS_OPTIONS: readonly ClassificationStatus[] = ['success', 'failed'];

/** Narrows an arbitrary string to a known option, or `undefined`. */
export function parseOption<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}
