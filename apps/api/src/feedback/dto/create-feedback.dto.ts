import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { FEEDBACK_SOURCES, type FeedbackSource } from '../schemas/feedback-item.schema';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  rawText!: string;

  @IsOptional()
  @IsIn([...FEEDBACK_SOURCES])
  source?: FeedbackSource;
}
