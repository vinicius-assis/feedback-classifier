import { Module } from '@nestjs/common';

import { FeedbackModule } from '../feedback/feedback.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { SlackSecretGuard } from './slack-secret.guard';

@Module({
  imports: [FeedbackModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, SlackSecretGuard],
})
export class IntegrationsModule {}
