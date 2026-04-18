import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ClassificationError,
  ClassificationService,
} from '../classification/classification.service';
import { BulkFeedbackItemDto } from './dto/bulk-feedback.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import {
  FeedbackItem,
  FeedbackItemDocument,
  FeedbackSource,
  SourceMetadata,
} from './schemas/feedback-item.schema';

export type BulkIngestResultItem =
  | { index: number; status: 'fulfilled'; data: FeedbackItemDocument }
  | { index: number; status: 'rejected'; error: string };

export type FeedbackStatsSummary = {
  total: { count: number }[];
  bySentiment: { _id: string | null; count: number }[];
  byFeatureArea: { _id: string | null; count: number }[];
  byUrgency: { _id: string | null; count: number }[];
  bySource: { _id: string | null; count: number }[];
  byClassificationStatus: { _id: string | null; count: number }[];
};

export type FeedbackListResult = {
  data: FeedbackItemDocument[];
  total: number;
  page: number;
  limit: number;
};

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

  async findAll(query: QueryFeedbackDto): Promise<FeedbackListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = this.buildListFilter(query);

    const [data, total] = await Promise.all([
      this.feedbackModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.feedbackModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<FeedbackItemDocument> {
    try {
      const doc = await this.feedbackModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException('Feedback item not found');
      }
      return doc;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      if (err instanceof Error && err.name === 'CastError') {
        throw new NotFoundException('Feedback item not found');
      }
      throw err;
    }
  }

  async getStatsSummary(): Promise<FeedbackStatsSummary> {
    const [row] = await this.feedbackModel
      .aggregate<FeedbackStatsSummary>([
        {
          $facet: {
            total: [{ $count: 'count' }],
            bySentiment: [{ $group: { _id: '$sentiment', count: { $sum: 1 } } }],
            byFeatureArea: [{ $group: { _id: '$featureArea', count: { $sum: 1 } } }],
            byUrgency: [{ $group: { _id: '$urgency', count: { $sum: 1 } } }],
            bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
            byClassificationStatus: [
              { $group: { _id: '$classificationStatus', count: { $sum: 1 } } },
            ],
          },
        },
      ])
      .exec();

    return (
      row ?? {
        total: [],
        bySentiment: [],
        byFeatureArea: [],
        byUrgency: [],
        bySource: [],
        byClassificationStatus: [],
      }
    );
  }

  private buildListFilter(query: QueryFeedbackDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    if (query.sentiment !== undefined) {
      filter.sentiment = query.sentiment;
    }
    if (query.featureArea !== undefined) {
      filter.featureArea = query.featureArea;
    }
    if (query.urgency !== undefined) {
      filter.urgency = query.urgency;
    }
    if (query.source !== undefined) {
      filter.source = query.source;
    }
    if (query.classificationStatus !== undefined) {
      filter.classificationStatus = query.classificationStatus;
    }
    return filter;
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
