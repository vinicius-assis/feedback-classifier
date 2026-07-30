import type {
  ClassificationStatus,
  FeatureArea,
  FeedbackSource,
  Sentiment,
  Urgency,
} from './types';

/**
 * One entry per value of a classification dimension. This is the single source
 * of truth: the dashboard filters derive their option lists from `key`, and the
 * charts derive their axis order, labels and colors from the same arrays — so a
 * new value can never show up in one place and be missing from the other.
 */
export type DomainOption<T extends string> = {
  key: T;
  label: string;
  colorToken: string;
};

export const SENTIMENT_DIMENSION: readonly DomainOption<Sentiment>[] = [
  { key: 'positive', label: 'Positive', colorToken: 'green.solid' },
  { key: 'neutral', label: 'Neutral', colorToken: 'blue.solid' },
  { key: 'negative', label: 'Negative', colorToken: 'red.solid' },
  { key: 'unknown', label: 'Unknown', colorToken: 'gray.solid' },
];

export const FEATURE_AREA_DIMENSION: readonly DomainOption<FeatureArea>[] = [
  { key: 'onboarding', label: 'Onboarding', colorToken: 'brand.solid' },
  { key: 'payments', label: 'Payments', colorToken: 'brand.solid' },
  { key: 'reporting', label: 'Reporting', colorToken: 'brand.solid' },
  { key: 'performance', label: 'Performance', colorToken: 'brand.solid' },
  { key: 'security', label: 'Security', colorToken: 'brand.solid' },
  { key: 'integrations', label: 'Integrations', colorToken: 'brand.solid' },
  { key: 'other', label: 'Other', colorToken: 'brand.solid' },
  { key: 'unknown', label: 'Unknown', colorToken: 'gray.solid' },
];

export const URGENCY_DIMENSION: readonly DomainOption<Urgency>[] = [
  { key: 'low', label: 'Low', colorToken: 'green.solid' },
  { key: 'medium', label: 'Medium', colorToken: 'yellow.solid' },
  { key: 'high', label: 'High', colorToken: 'red.solid' },
  { key: 'unknown', label: 'Unknown', colorToken: 'gray.solid' },
];

/** `slack_like` is intentionally absent: the web app does not ingest from Slack. */
export const SOURCE_DIMENSION: readonly DomainOption<FeedbackSource>[] = [
  { key: 'web_form', label: 'Web form', colorToken: 'brand.solid' },
  { key: 'web_bulk', label: 'Bulk import', colorToken: 'teal.solid' },
  { key: 'web_file', label: 'File import', colorToken: 'cyan.solid' },
];

export const CLASSIFICATION_STATUS_DIMENSION: readonly DomainOption<ClassificationStatus>[] = [
  { key: 'success', label: 'Success', colorToken: 'green.solid' },
  { key: 'failed', label: 'Failed', colorToken: 'red.solid' },
];

function keysOf<T extends string>(dimension: readonly DomainOption<T>[]): readonly T[] {
  return dimension.map((option) => option.key);
}

/**
 * The values the dashboard offers as filters. Also used to validate query
 * params, so a hand-edited URL cannot push a bogus value into the API call.
 */
export const SENTIMENT_OPTIONS = keysOf(SENTIMENT_DIMENSION);
export const FEATURE_AREA_OPTIONS = keysOf(FEATURE_AREA_DIMENSION);
export const URGENCY_OPTIONS = keysOf(URGENCY_DIMENSION);
export const SOURCE_OPTIONS = keysOf(SOURCE_DIMENSION);
export const CLASSIFICATION_STATUS_OPTIONS = keysOf(CLASSIFICATION_STATUS_DIMENSION);

/** Narrows an arbitrary string to a known option, or `undefined`. */
export function parseOption<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}
