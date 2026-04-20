import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.feedbackService.deleteById(id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  removeAll() {
    return this.feedbackService.deleteAll();
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

  /** Upload `.csv` or `.xlsx`: one feedback per row (first column). Source `web_file`. */
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  importFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    return this.feedbackService.importFile(file.buffer, file.mimetype, file.originalname);
  }
}
