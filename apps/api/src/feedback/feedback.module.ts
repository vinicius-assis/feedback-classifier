import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackItem, FeedbackItemSchema } from './schemas/feedback-item.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FeedbackItem.name, schema: FeedbackItemSchema }])],
  exports: [MongooseModule],
})
export class FeedbackModule {}
