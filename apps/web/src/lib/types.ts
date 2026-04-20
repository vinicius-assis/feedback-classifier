/** Client types aligned with `apps/api` feedback schema and DTOs. */

export type FeedbackSource = 'web_form' | 'web_bulk' | 'slack_like';

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

export type SlackFeedbackBody = {
  text: string;
  externalMessageId: string;
};
