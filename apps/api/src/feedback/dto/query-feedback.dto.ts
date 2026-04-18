import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  CLASSIFICATION_STATUSES,
  type ClassificationStatus,
  FEATURE_AREAS,
  type FeatureArea,
  FEEDBACK_SOURCES,
  type FeedbackSource,
  SENTIMENTS,
  type Sentiment,
  URGENCIES,
  type Urgency,
} from '../schemas/feedback-item.schema';

export class QueryFeedbackDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn([...SENTIMENTS])
  sentiment?: Sentiment;

  @IsOptional()
  @IsIn([...FEATURE_AREAS])
  featureArea?: FeatureArea;

  @IsOptional()
  @IsIn([...URGENCIES])
  urgency?: Urgency;

  @IsOptional()
  @IsIn([...FEEDBACK_SOURCES])
  source?: FeedbackSource;

  @IsOptional()
  @IsIn([...CLASSIFICATION_STATUSES])
  classificationStatus?: ClassificationStatus;
}
