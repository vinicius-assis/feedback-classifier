import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassificationModule } from '../classification/classification.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackItem, FeedbackItemSchema } from './schemas/feedback-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FeedbackItem.name, schema: FeedbackItemSchema }]),
    ClassificationModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [MongooseModule, FeedbackService],
})
export class FeedbackModule {}
