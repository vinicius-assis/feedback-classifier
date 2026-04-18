import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BulkFeedbackItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  rawText!: string;
}

/** Body for `POST /api/feedback/bulk`. Maximum **20** items per request. */
export class BulkFeedbackDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BulkFeedbackItemDto)
  items!: BulkFeedbackItemDto[];
}
