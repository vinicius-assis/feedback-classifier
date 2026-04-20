import { Injectable } from '@nestjs/common';

import { FeedbackService } from '../feedback/feedback.service';
import { FeedbackItemDocument } from '../feedback/schemas/feedback-item.schema';
import { SlackFeedbackDto } from './dto/slack-feedback.dto';

@Injectable()
export class IntegrationsService {
  constructor(private readonly feedbackService: FeedbackService) {}

  async ingestSlack(
    dto: SlackFeedbackDto,
  ): Promise<{ doc: FeedbackItemDocument; created: boolean }> {
    const existing = await this.feedbackService.findByExternalMessageId(dto.externalMessageId);
    if (existing) {
      return { doc: existing, created: false };
    }

    const sourceMetadata: {
      externalMessageId: string;
      channel?: string;
      userDisplayName?: string;
    } = { externalMessageId: dto.externalMessageId };
    if (dto.channel !== undefined && dto.channel !== '') {
      sourceMetadata.channel = dto.channel;
    }
    if (dto.userDisplayName !== undefined && dto.userDisplayName !== '') {
      sourceMetadata.userDisplayName = dto.userDisplayName;
    }

    const doc = await this.feedbackService.ingestWithOptions({
      rawText: dto.text,
      source: 'slack_like',
      sourceMetadata,
    });

    return { doc, created: true };
  }
}
