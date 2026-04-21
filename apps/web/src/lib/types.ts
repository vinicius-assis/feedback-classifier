/** Client types aligned with `apps/api` feedback schema and DTOs. */

/** Ingest source. `slack_like` is only returned by the API for legacy rows; Slack UI is disabled in the web app. */
export type FeedbackSource = 'web_form' | 'web_bulk' | 'web_file' | 'slack_like';

export type FeatureArea =
  | 'onboarding'
  | 'payments'
  | 'reporting'
  | 'performance'
  | 'security'
  | 'integrations'
  | 'other'
  | 'unknown';

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'unknown';

export type Urgency = 'low' | 'medium' | 'high' | 'unknown';

export type ClassificationStatus = 'success' | 'failed';

export type SourceMetadata = {
  externalMessageId?: string;
  channel?: string;
  userDisplayName?: string;
};

/** JSON shape from the API (dates as ISO strings). */
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

export type FeedbackStatsSummary = {
  total: { count: number }[];
  bySentiment: { _id: string | null; count: number }[];
  byFeatureArea: { _id: string | null; count: number }[];
  byUrgency: { _id: string | null; count: number }[];
  bySource: { _id: string | null; count: number }[];
  byClassificationStatus: { _id: string | null; count: number }[];
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

export type CreateFeedbackBody = {
  rawText: string;
  source?: FeedbackSource;
};

export type BulkFeedbackBody = {
  items: { rawText: string }[];
};

// Slack — web ingest disabled (kept for reference / API shape)
// export type SlackFeedbackBody = {
//   text: string;
//   externalMessageId: string;
//   channel?: string;
//   userDisplayName?: string;
// };
