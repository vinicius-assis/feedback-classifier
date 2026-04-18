import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ClassificationError,
  ClassificationService,
} from '../classification/classification.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackItem, FeedbackItemDocument } from './schemas/feedback-item.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(FeedbackItem.name) private readonly feedbackModel: Model<FeedbackItemDocument>,
    private readonly classificationService: ClassificationService,
  ) {}

  async ingest(dto: CreateFeedbackDto): Promise<FeedbackItemDocument> {
    const source = dto.source ?? 'web_form';
    const doc = new this.feedbackModel({ rawText: dto.rawText, source });

    try {
      const result = await this.classificationService.classify(dto.rawText);
      doc.sentiment = result.output.sentiment;
      doc.featureArea = result.output.featureArea;
      doc.urgency = result.output.urgency;
      doc.summary = result.output.summary;
      doc.set('model', result.model);
      doc.promptVersion = result.promptVersion;
      doc.classificationRaw = result.classificationRaw;
      doc.classificationStatus = 'success';
    } catch (err) {
      if (err instanceof ClassificationError) {
        doc.classificationStatus = 'failed';
        doc.classificationError = err.message;
      } else {
        throw err;
      }
    }

    await doc.save();
    return doc;
  }
}
