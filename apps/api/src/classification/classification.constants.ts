import { z } from 'zod';
import {
  FEATURE_AREAS,
  FeatureArea,
  SENTIMENTS,
  Sentiment,
  URGENCIES,
  Urgency,
} from '../feedback/schemas/feedback-item.schema';

/** Nest injection token for the OpenAI SDK client. */
export const OPENAI_CLIENT = 'OPENAI_CLIENT';

/** Must stay in sync with prompt content when taxonomy changes. */
export const PROMPT_VERSION = 'v1' as const;

const sentimentZodEnum = z.enum(SENTIMENTS as unknown as [Sentiment, ...Sentiment[]]);
const featureAreaZodEnum = z.enum(FEATURE_AREAS as unknown as [FeatureArea, ...FeatureArea[]]);
const urgencyZodEnum = z.enum(URGENCIES as unknown as [Urgency, ...Urgency[]]);

/**
 * Expected JSON shape from the model (post-parse validation in Phase D — Grupo 2).
 * Invalid enum values coerce to `unknown` per spec.
 */
export const classificationOutputSchema = z.object({
  sentiment: sentimentZodEnum.catch('unknown'),
  featureArea: featureAreaZodEnum.catch('unknown'),
  urgency: urgencyZodEnum.catch('unknown'),
  summary: z.string().max(1024).catch(''),
});

export type ClassificationOutput = z.infer<typeof classificationOutputSchema>;

function formatEnumList(values: readonly string[]): string {
  return values.join(', ');
}

/**
 * System + user instructions for v1. Uses taxonomy from feedback schema so enums stay aligned.
 */
export function buildClassificationPrompt(rawText: string): string {
  const systemPart = [
    `You are a product feedback classifier. Respond with JSON only.`,
    `Prompt version: ${PROMPT_VERSION}.`,
    `Pick exactly one value for each enum field from the allowed sets; if none fit, use "unknown".`,
    `Allowed sentiment values: ${formatEnumList(SENTIMENTS)}.`,
    `Allowed featureArea values: ${formatEnumList(FEATURE_AREAS)}.`,
    `Allowed urgency values: ${formatEnumList(URGENCIES)}.`,
    `Include a short summary string (max ~200 words).`,
    `JSON keys required: sentiment, featureArea, urgency, summary.`,
  ].join('\n');

  const userPart = `Classify the following user feedback:\n\n---\n${rawText}\n---`;

  return `${systemPart}\n\n${userPart}`;
}
