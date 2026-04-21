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
export const PROMPT_VERSION = 'v4' as const;

const sentimentZodEnum = z.enum(SENTIMENTS as unknown as [Sentiment, ...Sentiment[]]);
const featureAreaZodEnum = z.enum(FEATURE_AREAS as unknown as [FeatureArea, ...FeatureArea[]]);
const urgencyZodEnum = z.enum(URGENCIES as unknown as [Urgency, ...Urgency[]]);

/**
 * Expected JSON shape from the model (post-parse validation in Phase D — Grupo 2).
 * Invalid enum values coerce to `unknown` per spec.
 */
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export const classificationOutputSchema = z.object({
  sentiment: sentimentZodEnum.catch('unknown'),
  featureArea: featureAreaZodEnum.catch('unknown'),
  urgency: urgencyZodEnum.catch('unknown'),
  summary: z
    .string()
    .max(1024)
    .transform((s) => s.replace(CONTROL_CHAR_REGEX, '').trim())
    .catch(''),
});

export type ClassificationOutput = z.infer<typeof classificationOutputSchema>;

const FEATURE_AREA_DESCRIPTIONS: Record<string, string> = {
  onboarding:
    'User is learning the product, configuring initial settings, finalizing a setup flow, or unsure what actions are reversible. Includes first-run friction, UI copy clarity, and trust-building during commitment steps.',
  payments:
    'Money movement, transaction acknowledgements, reconciliation, billing, duplicate charges, or any flow where a financial operation may succeed or fail silently.',
  reporting:
    'Dashboards, exported data, analytics views, cohort/funnel metrics, segment naming, or any feature that surfaces aggregated information to stakeholders.',
  performance:
    'Perceived speed, latency, micro-stalls, unexpected refreshes, scale degradation (works fine with few items, breaks with many), or reliability under load.',
  security:
    'Audit trails, compliance, trust in automated checks, access controls, data integrity for external reviews, or any concern about what the system records and who can verify it.',
  integrations:
    'Third-party connections, partner pipelines, handoffs between systems or teams, webhook/API reliability, or collaboration tools like annotations shared across roles.',
  other:
    'Cannot be mapped to any of the above areas with reasonable confidence — genuinely ambiguous, multi-area with no clear anchor, or a transient environment issue (browser quirk, upstream fluke) that cannot be pinned to a specific product surface.',
  unknown: 'Not enough information to determine the area.',
};

const URGENCY_DESCRIPTIONS: Record<string, string> = {
  low: 'User has adapted (workaround in place), pure wish or quality-of-life improvement, no blocked workflow, no business deadline at risk.',
  medium:
    'Recurring friction with no immediate workaround, causes awkward handoffs or repeated rework, or mild time pressure mentioned.',
  high: 'Blocking an ONGOING or IMMINENT business deadline, active compliance risk, data loss potential, or the user explicitly signals immediate escalation. A past impact ("cost us a slot last week") does NOT qualify alone — there must be an upcoming or open deadline.',
  unknown: 'Not enough signal to assess urgency.',
};

const SENTIMENT_DESCRIPTIONS: Record<string, string> = {
  positive:
    'Overall tone is appreciative or the user expresses net satisfaction, even if minor friction is mentioned. Do NOT use for feature requests or suggestions that primarily describe a missing or broken state, even if phrased constructively.',
  neutral:
    'Factual observation, mixed signal, or a problem described matter-of-factly with no emotional language. Use this when the user reports an issue without frustration, distrust, or broken-state language.',
  negative:
    'Explicit frustration, disappointment, active loss of trust, or language that signals the user feels something is broken or unreliable. Requires emotional language — a plain description of a problem does not qualify on its own.',
  unknown: 'Impossible to determine sentiment from the text.',
};

function formatEnumWithDescriptions(descriptions: Record<string, string>): string {
  return Object.entries(descriptions)
    .map(([key, desc]) => `  "${key}": ${desc}`)
    .join('\n');
}

/**
 * System + user instructions for v4. Uses taxonomy from feedback schema so enums stay aligned.
 * `systemContent` and `userContent` are sent as separate message roles to reduce prompt-injection risk.
 */
export function buildClassificationPrompt(rawText: string): {
  systemContent: string;
  userContent: string;
} {
  const systemContent = [
    `You are a product feedback classifier. Respond with JSON only.`,
    `Prompt version: ${PROMPT_VERSION}.`,
    `Pick exactly one value for each enum field using the taxonomy below; if none fit, use "unknown".`,
    ``,
    `SENTIMENT — the overall emotional tone of the message:`,
    formatEnumWithDescriptions(SENTIMENT_DESCRIPTIONS),
    ``,
    `FEATURE_AREA — the primary product surface the feedback refers to:`,
    formatEnumWithDescriptions(FEATURE_AREA_DESCRIPTIONS),
    ``,
    `URGENCY — how time-sensitive or business-critical the issue is:`,
    formatEnumWithDescriptions(URGENCY_DESCRIPTIONS),
    ``,
    `Rules:`,
    `- Choose the single featureArea that best anchors the core problem, even when the text touches multiple areas.`,
    `- urgency=low when the user has already found a workaround (screenshots, exports, manual steps) or the feedback is a wish with no deadline.`,
    `- urgency=medium when cumulative repeated friction degrades team throughput or causes repeated rework, even without a hard deadline.`,
    `- Do NOT raise urgency just because an issue is frequent — frequency alone is not urgency.`,
    `- sentiment=neutral when the user reports a problem matter-of-factly; negative requires explicit emotional language.`,
    `- Use sentiment=positive when the opening or dominant tone is appreciative (e.g. "genuinely less draining", "much easier now"), even if secondary friction is also mentioned.`,
    `- Do NOT use sentiment=positive when the text is purely a feature request or a factual problem report with no net praise in the dominant tone.`,
    `- Include a short summary string (max ~200 words).`,
    `JSON keys required: sentiment, featureArea, urgency, summary.`,
    ``,
    `CALIBRATION EXAMPLES (for boundary calibration only — do not repeat in output):`,
    ``,
    `Text: "I keep exporting defensively before I explore corners I do not know by name."`,
    `→ sentiment=negative  (frustration with discoverability, not a neutral observation)`,
    `→ featureArea=reporting  (export habit anchors to reporting surface)`,
    `→ urgency=low  (active workaround in place, no deadline)`,
    ``,
    `Text: "If annotations lived next to the object, handoffs to design would stop losing nuance."`,
    `→ sentiment=neutral  (constructive wish describing a broken state — NOT net praise)`,
    `→ featureArea=integrations  (cross-role handoff between systems/teams)`,
    `→ urgency=low  (no blocked workflow, no deadline)`,
    ``,
    `Text: "The micro-stalls stack — five seconds here, a refresh there — and by Friday nobody remembers which annoyance started first."`,
    `→ sentiment=neutral  (matter-of-fact report, no explicit frustration language)`,
    `→ featureArea=performance  (latency + micro-stalls)`,
    `→ urgency=medium  (cumulative friction degrading team throughput over time)`,
    ``,
    `Text: "Walking away and repeating the ritual an hour later behaved normally, so I filed it under weird Tuesday rather than opening a ticket."`,
    `→ sentiment=neutral`,
    `→ featureArea=other  (transient browser/environment fluke — no product surface anchor)`,
    `→ urgency=low`,
    ``,
    `Text: "The same gesture lands instantly before noon and then hitches after lunch whenever the handoff crosses the partner pipe, which makes live triage with CS awkward because we cannot point to a rule — only a mood."`,
    `→ sentiment=neutral  (reports an inconsistency matter-of-factly; "awkward" describes an outcome, not frustration language)`,
    `→ featureArea=integrations  ("partner pipe" is the anchor, not performance)`,
    `→ urgency=medium`,
    ``,
    `Text: "We approximate it by stitching two exports into Sheets, which works until someone renames a segment and the whole story quietly drifts."`,
    `→ sentiment=neutral  (describes a fragile workaround as a fact, no emotional language)`,
    `→ featureArea=reporting`,
    `→ urgency=low  (workaround is actively in use, no deadline mentioned)`,
    ``,
    `Text: "Reconciliation turns into a loop because the default on the saved lens disagrees with what the share link suggests, and that already cost us a slot with finance yesterday evening."`,
    `→ sentiment=negative  (the past impact signals real frustration)`,
    `→ featureArea=payments  (reconciliation + finance)`,
    `→ urgency=medium  (past impact, not an ongoing/imminent compliance or data-loss deadline)`,
    ``,
    `Text: "The consolidated path bundles what I used to chase across three different surfaces, which is genuinely less draining, yet nothing in the copy tells me what is reversible before I commit, so I still screenshot every time I am about to finalize."`,
    `→ sentiment=positive  (opens with explicit net appreciation "genuinely less draining"; the friction is secondary, not the dominant tone)`,
    `→ featureArea=onboarding  (setup flow, reversibility of actions, trust during commitment steps)`,
    `→ urgency=low  (workaround in place, no deadline)`,
  ].join('\n');

  const userContent = `Classify the following user feedback:

<feedback>
${rawText}
</feedback>`;

  return { systemContent, userContent };
}
