import { Body, Controller, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { SlackFeedbackDto } from './dto/slack-feedback.dto';
import { IntegrationsService } from './integrations.service';
import { SlackSecretGuard } from './slack-secret.guard';

@Controller('integrations/slack')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('feedback')
  @UseGuards(SlackSecretGuard)
  async slackFeedback(@Body() dto: SlackFeedbackDto, @Res({ passthrough: true }) res: Response) {
    const { doc, created } = await this.integrationsService.ingestSlack(dto);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return doc;
  }
}
