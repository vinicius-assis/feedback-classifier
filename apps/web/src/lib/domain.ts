import type {
  ClassificationStatus,
  FeatureArea,
  FeedbackSource,
  Sentiment,
  Urgency,
} from '@feedback-classifier/shared';

/**
 * How each value of a classification dimension is presented: the dashboard
 * filters derive their option lists from `key`, and the charts derive their
 * axis order, labels and colors from the same arrays.
 *
 * The taxonomy itself lives in `@feedback-classifier/shared`. Each dimension is
 * built from a `Record` over the shared union, so a value added on the API side
 * fails to compile here instead of silently disappearing from the UI.
 */
export type DomainOption<T extends string> = {
  key: T;
  label: string;
  colorToken: string;
};

type Presentation = Omit<DomainOption<string>, 'key'>;

function dimension<T extends string>(
  order: readonly T[],
  presentation: Record<T, Presentation>,
): readonly DomainOption<T>[] {
  return order.map((key) => ({ key, ...presentation[key] }));
}

export const SENTIMENT_DIMENSION = dimension<Sentiment>(
  ['positive', 'neutral', 'negative', 'unknown'],
  {
    positive: { label: 'Positive', colorToken: 'green.solid' },
    neutral: { label: 'Neutral', colorToken: 'blue.solid' },
    negative: { label: 'Negative', colorToken: 'red.solid' },
    unknown: { label: 'Unknown', colorToken: 'gray.solid' },
  },
);

export const FEATURE_AREA_DIMENSION = dimension<FeatureArea>(
  [
    'onboarding',
    'payments',
    'reporting',
    'performance',
    'security',
    'integrations',
    'other',
    'unknown',
  ],
  {
    onboarding: { label: 'Onboarding', colorToken: 'brand.solid' },
    payments: { label: 'Payments', colorToken: 'brand.solid' },
    reporting: { label: 'Reporting', colorToken: 'brand.solid' },
    performance: { label: 'Performance', colorToken: 'brand.solid' },
    security: { label: 'Security', colorToken: 'brand.solid' },
    integrations: { label: 'Integrations', colorToken: 'brand.solid' },
    other: { label: 'Other', colorToken: 'brand.solid' },
    unknown: { label: 'Unknown', colorToken: 'gray.solid' },
  },
);

export const URGENCY_DIMENSION = dimension<Urgency>(['low', 'medium', 'high', 'unknown'], {
  low: { label: 'Low', colorToken: 'green.solid' },
  medium: { label: 'Medium', colorToken: 'yellow.solid' },
  high: { label: 'High', colorToken: 'red.solid' },
  unknown: { label: 'Unknown', colorToken: 'gray.solid' },
});

/**
 * `slack_like` is excluded on purpose: the web app does not ingest from Slack,
 * so it is not offered as a filter and rolls into "Other" in the source chart.
 * Excluding it from the union here is what keeps that intentional, rather than
 * looking like an oversight.
 */
export type WebFeedbackSource = Exclude<FeedbackSource, 'slack_like'>;

export const SOURCE_DIMENSION = dimension<WebFeedbackSource>(['web_form', 'web_bulk', 'web_file'], {
  web_form: { label: 'Web form', colorToken: 'brand.solid' },
  web_bulk: { label: 'Bulk import', colorToken: 'teal.solid' },
  web_file: { label: 'File import', colorToken: 'cyan.solid' },
});

export const CLASSIFICATION_STATUS_DIMENSION = dimension<ClassificationStatus>(
  ['success', 'failed'],
  {
    success: { label: 'Success', colorToken: 'green.solid' },
    failed: { label: 'Failed', colorToken: 'red.solid' },
  },
);

function keysOf<T extends string>(dim: readonly DomainOption<T>[]): readonly T[] {
  return dim.map((option) => option.key);
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
