/**
 * The classification taxonomy. These arrays are the runtime source of truth on
 * both sides: the API validates request payloads and Mongoose enums against
 * them, and the web app derives its filter options and chart series from them.
 */

export const FEEDBACK_SOURCES = ['web_form', 'web_bulk', 'web_file', 'slack_like'] as const;
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

/** Closed taxonomy (v1) — keep in sync with the classification prompt. */
export const FEATURE_AREAS = [
  'onboarding',
  'payments',
  'reporting',
  'performance',
  'security',
  'integrations',
  'other',
  'unknown',
] as const;
export type FeatureArea = (typeof FEATURE_AREAS)[number];

export const SENTIMENTS = ['positive', 'neutral', 'negative', 'unknown'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const URGENCIES = ['low', 'medium', 'high', 'unknown'] as const;
export type Urgency = (typeof URGENCIES)[number];

export const CLASSIFICATION_STATUSES = ['success', 'failed'] as const;
export type ClassificationStatus = (typeof CLASSIFICATION_STATUSES)[number];
