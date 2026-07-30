import type {
  ClassificationStatus,
  FeatureArea,
  FeedbackSource,
  Sentiment,
  Urgency,
} from './domain.js';

/**
 * The HTTP contract between `apps/api` and `apps/web`: what the API returns and
 * what it accepts. Dates are ISO strings, as they come out of JSON.
 */

/** Slack-like ingest sends a stable id so retries stay idempotent. */
export type SourceMetadata = {
  externalMessageId?: string;
  channel?: string;
  userDisplayName?: string;
};

export type FeedbackItem = {
  _id: string;
  rawText: string;
  source: FeedbackSource;
  sourceMetadata?: SourceMetadata;
  sentiment?: Sentiment;
  featureArea?: FeatureArea;
  urgency?: Urgency;
  summary?: string;
  model?: string;
  promptVersion?: string;
  classificationRaw?: unknown;
  classificationStatus?: ClassificationStatus;
  classificationError?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type FeedbackListResult = {
  data: FeedbackItem[];
  total: number;
  page: number;
  limit: number;
};

/** A `$group` bucket from the stats aggregation. `_id` is null for never-classified docs. */
export type StatBucket = { _id: string | null; count: number };

export type FeedbackStatsSummary = {
  total: { count: number }[];
  bySentiment: StatBucket[];
  byFeatureArea: StatBucket[];
  byUrgency: StatBucket[];
  bySource: StatBucket[];
  byClassificationStatus: StatBucket[];
};

export type BulkIngestResultItem =
  | { index: number; status: 'fulfilled'; data: FeedbackItem }
  | { index: number; status: 'rejected'; error: string };

export type FeedbackImportResult = {
  total: number;
  fulfilled: number;
  failed: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

/** Query params for `GET /feedback`. */
export type FeedbackFilters = {
  page?: number;
  limit?: number;
  sentiment?: Sentiment;
  featureArea?: FeatureArea;
  urgency?: Urgency;
  source?: FeedbackSource;
  classificationStatus?: ClassificationStatus;
};

/** Body for `POST /feedback`. */
export type CreateFeedbackBody = {
  rawText: string;
  source?: FeedbackSource;
};

/** Body for `POST /feedback/bulk`. At most 20 items per request. */
export type BulkFeedbackBody = {
  items: { rawText: string }[];
};

export const MAX_BULK_ITEMS = 20;
