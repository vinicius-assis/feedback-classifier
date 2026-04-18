import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

/** Slack-like ingest must send a stable id for idempotent retries (spec §5). */
@Schema({ _id: false })
export class SourceMetadata {
  @Prop({ type: String })
  externalMessageId?: string;

  @Prop({ type: String })
  channel?: string;

  @Prop({ type: String })
  userDisplayName?: string;
}

export const FEEDBACK_SOURCES = ['web_form', 'web_bulk', 'slack_like'] as const;
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

/** Closed taxonomy (v1) — keep in sync with prompt / Zod in Phase D. */
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

@Schema({ collection: 'feedback_items', timestamps: true })
export class FeedbackItem {
  @Prop({ required: true, type: String })
  rawText!: string;

  @Prop({ required: true, enum: FEEDBACK_SOURCES, type: String })
  source!: FeedbackSource;

  @Prop({ type: SourceMetadata })
  sourceMetadata?: SourceMetadata;

  @Prop({ enum: SENTIMENTS, type: String })
  sentiment?: Sentiment;

  @Prop({ enum: FEATURE_AREAS, type: String })
  featureArea?: FeatureArea;

  @Prop({ enum: URGENCIES, type: String })
  urgency?: Urgency;

  @Prop({ type: String })
  summary?: string;

  @Prop({ type: String })
  model?: string;

  @Prop({ type: String })
  promptVersion?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  classificationRaw?: unknown;

  @Prop({ enum: CLASSIFICATION_STATUSES, type: String })
  classificationStatus?: ClassificationStatus;

  @Prop({ type: String })
  classificationError?: string;
}

export type FeedbackItemDocument = HydratedDocument<FeedbackItem>;

export const FeedbackItemSchema = SchemaFactory.createForClass(FeedbackItem);

FeedbackItemSchema.index({ createdAt: -1 });
FeedbackItemSchema.index({ featureArea: 1, urgency: 1, sentiment: 1 });
FeedbackItemSchema.index({ 'sourceMetadata.externalMessageId': 1 }, { unique: true, sparse: true });
