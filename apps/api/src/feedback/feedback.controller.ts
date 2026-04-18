import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { BulkFeedbackDto } from './dto/bulk-feedback.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.ingest(dto);
  }

  /** Batch ingest: max **20** `items`; each result includes `index` and `fulfilled` data or `rejected` error. */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulk(@Body() dto: BulkFeedbackDto) {
    return this.feedbackService.ingestBulk(dto.items);
  }
}
