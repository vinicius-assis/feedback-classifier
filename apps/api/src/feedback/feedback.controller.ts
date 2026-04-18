import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

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
}
