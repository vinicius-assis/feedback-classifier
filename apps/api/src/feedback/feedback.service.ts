import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { FeedbackSource } from '@feedback-classifier/shared';

import {
  ClassificationError,
  ClassificationService,
} from '../classification/classification.service';
import { BulkFeedbackItemDto } from './dto/bulk-feedback.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { FeedbackItem, FeedbackItemDocument, SourceMetadata } from './schemas/feedback-item.schema';
import * as XLSX from 'xlsx';

const RAW_TEXT_MAX_LENGTH = 8192;
const BULK_BATCH_SIZE = 20;

/** First-column header labels (normalized) we skip when present on the first non-empty row. */
const IMPORT_HEADER_LABELS = new Set([
  'feedback',
  'feedbacks',
  'comment',
  'comments',
  'text',
  'message',
  'messages',
  'notes',
  'description',
  'content',
  'body',
  'rawtext',
  'rawtexts',
]);

export type FeedbackImportErrorRow = { row: number; message: string };

export type FeedbackImportResult = {
  total: number;
  fulfilled: number;
  failed: number;
  skipped: number;
  errors: FeedbackImportErrorRow[];
};

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

export type DeleteAllFeedbackResult = {
  deletedCount: number;
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

  /**
   * Re-runs classification on stored `rawText` and updates the document (success or failed).
   */
  async reclassify(id: string): Promise<FeedbackItemDocument> {
    const doc = await this.findById(id);
    try {
      const result = await this.classificationService.classify(doc.rawText);
      doc.sentiment = result.output.sentiment;
      doc.featureArea = result.output.featureArea;
      doc.urgency = result.output.urgency;
      doc.summary = result.output.summary;
      doc.set('model', result.model);
      doc.promptVersion = result.promptVersion;
      doc.classificationRaw = result.classificationRaw;
      doc.classificationStatus = 'success';
      doc.classificationError = undefined;
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

  async deleteById(id: string): Promise<void> {
    try {
      const result = await this.feedbackModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException('Feedback item not found');
      }
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

  async deleteAll(): Promise<DeleteAllFeedbackResult> {
    const result = await this.feedbackModel.deleteMany({}).exec();
    return { deletedCount: result.deletedCount ?? 0 };
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

  async ingestBulk(
    items: BulkFeedbackItemDto[],
    source: FeedbackSource = 'web_bulk',
  ): Promise<BulkIngestResultItem[]> {
    const settled = await Promise.allSettled(
      items.map((item, index) =>
        this.persistFeedback({ rawText: item.rawText, source }).then((doc) => ({
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

  /**
   * Parses a CSV or XLSX buffer: one feedback per row, first column only.
   * Batches rows into chunks of {@link BULK_BATCH_SIZE} and ingests with source `web_file`.
   */
  async importFile(
    buffer: Buffer,
    mimetype: string,
    originalname?: string,
  ): Promise<FeedbackImportResult> {
    const allowed = new Set([
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]);

    let resolvedMime = mimetype;
    if (!allowed.has(resolvedMime) && originalname) {
      const lower = originalname.toLowerCase();
      if (lower.endsWith('.csv')) {
        resolvedMime = 'text/csv';
      } else if (lower.endsWith('.xlsx')) {
        resolvedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
    }

    if (!allowed.has(resolvedMime)) {
      throw new BadRequestException(`Unsupported file type: ${mimetype || 'unknown'}`);
    }

    const { rows, skipped } = this.parseFeedbackSpreadsheet(buffer);
    if (rows.length === 0) {
      throw new BadRequestException('No feedback rows found in file');
    }

    let fulfilled = 0;
    let failed = 0;
    const errors: FeedbackImportErrorRow[] = [];

    for (let offset = 0; offset < rows.length; offset += BULK_BATCH_SIZE) {
      const slice = rows.slice(offset, offset + BULK_BATCH_SIZE);
      const batchItems: BulkFeedbackItemDto[] = slice.map((r) => ({ rawText: r.rawText }));
      const results = await this.ingestBulk(batchItems, 'web_file');
      for (const r of results) {
        const sheetRow = slice[r.index]!.sheetRow;
        if (r.status === 'fulfilled') {
          fulfilled += 1;
        } else {
          failed += 1;
          errors.push({ row: sheetRow, message: r.error });
        }
      }
    }

    return {
      total: rows.length,
      fulfilled,
      failed,
      skipped,
      errors,
    };
  }

  private parseFeedbackSpreadsheet(buffer: Buffer): {
    rows: { sheetRow: number; rawText: string }[];
    skipped: number;
  } {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch {
      throw new BadRequestException('Could not read spreadsheet file');
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('File has no sheets');
    }

    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<
      (string | number | boolean | Date | null | undefined)[]
    >(sheet, { header: 1, defval: '', raw: false });

    let skippedBlanks = 0;
    const nonEmpty: { sheetRow: number; text: string }[] = [];

    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];
      const sheetRow = i + 1;
      const firstCell = Array.isArray(row) ? row[0] : undefined;
      const text = FeedbackService.cellToString(firstCell).trim();
      if (!text) {
        skippedBlanks += 1;
        continue;
      }
      nonEmpty.push({ sheetRow, text });
    }

    let skippedHeader = 0;
    let start = 0;
    if (nonEmpty.length > 0 && FeedbackService.isLikelyImportHeader(nonEmpty[0]!.text)) {
      skippedHeader = 1;
      start = 1;
    }

    const rows: { sheetRow: number; rawText: string }[] = [];
    for (let j = start; j < nonEmpty.length; j++) {
      const { sheetRow, text } = nonEmpty[j]!;
      const rawText = text.length > RAW_TEXT_MAX_LENGTH ? text.slice(0, RAW_TEXT_MAX_LENGTH) : text;
      rows.push({ sheetRow, rawText });
    }

    return { rows, skipped: skippedBlanks + skippedHeader };
  }

  private static cellToString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  }

  private static isLikelyImportHeader(value: string): boolean {
    const key = value
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
    return IMPORT_HEADER_LABELS.has(key);
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
