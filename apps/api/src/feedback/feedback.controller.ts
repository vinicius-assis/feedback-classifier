import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { BulkFeedbackDto } from './dto/bulk-feedback.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /** Aggregated counts for dashboard cards (must be registered before `:id`). */
  @Get('stats/summary')
  statsSummary() {
    return this.feedbackService.getStatsSummary();
  }

  /** Paginated list with optional filters. */
  @Get()
  findAll(@Query() query: QueryFeedbackDto) {
    return this.feedbackService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedbackService.findById(id);
  }

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
