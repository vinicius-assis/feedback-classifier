import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { MAX_BULK_ITEMS } from '@feedback-classifier/shared';

export class BulkFeedbackItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  rawText!: string;
}

/** Body for `POST /api/feedback/bulk`. Cap comes from `MAX_BULK_ITEMS`. */
export class BulkFeedbackDto {
  @IsArray()
  @ArrayMaxSize(MAX_BULK_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => BulkFeedbackItemDto)
  items!: BulkFeedbackItemDto[];
}
