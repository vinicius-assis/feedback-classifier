import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ClassificationError,
  ClassificationService,
} from '../classification/classification.service';
import { BulkFeedbackItemDto } from './dto/bulk-feedback.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import {
  FeedbackItem,
  FeedbackItemDocument,
  FeedbackSource,
  SourceMetadata,
} from './schemas/feedback-item.schema';

export type BulkIngestResultItem =
  | { index: number; status: 'fulfilled'; data: FeedbackItemDocument }
  | { index: number; status: 'rejected'; error: string };

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(FeedbackItem.name) private readonly feedbackModel: Model<FeedbackItemDocument>,
    private readonly classificationService: ClassificationService,
  ) {}

  async ingest(dto: CreateFeedbackDto): Promise<FeedbackItemDocument> {
    return this.ingestWithOptions({
      rawText: dto.rawText,
      source: dto.source ?? 'web_form',
    });
  }

  /**
   * Persists and classifies feedback (e.g. single web form, bulk row, Slack-like).
   */
  async ingestWithOptions(params: {
    rawText: string;
    source: FeedbackSource;
    sourceMetadata?: SourceMetadata;
  }): Promise<FeedbackItemDocument> {
    return this.persistFeedback(params);
  }

  async findByExternalMessageId(externalMessageId: string): Promise<FeedbackItemDocument | null> {
    return this.feedbackModel
      .findOne({ 'sourceMetadata.externalMessageId': externalMessageId })
      .exec();
  }

  async ingestBulk(items: BulkFeedbackItemDto[]): Promise<BulkIngestResultItem[]> {
    const settled = await Promise.allSettled(
      items.map((item, index) =>
        this.persistFeedback({ rawText: item.rawText, source: 'web_bulk' }).then((doc) => ({
          index,
          doc,
        })),
      ),
    );

    return settled.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          index: result.value.index,
          status: 'fulfilled' as const,
          data: result.value.doc,
        };
      }
      const reason = result.reason;
      return {
        index,
        status: 'rejected' as const,
        error: reason instanceof Error ? reason.message : String(reason),
      };
    });
  }

  private async persistFeedback(params: {
    rawText: string;
    source: FeedbackSource;
    sourceMetadata?: SourceMetadata;
  }): Promise<FeedbackItemDocument> {
    const doc = new this.feedbackModel({
      rawText: params.rawText,
      source: params.source,
      ...(params.sourceMetadata ? { sourceMetadata: params.sourceMetadata } : {}),
    });

    try {
      const result = await this.classificationService.classify(params.rawText);
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
