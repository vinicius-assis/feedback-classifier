# Feedback examples for web flow

Use these texts directly in the web app (`/ingest` and `/ingest/bulk`) to validate classification and dashboard filters.

**How to read this doc:** Each line is intentionally **indirect** (mixed clauses, no keyword stuffing like “slow”, “payment failed”, or “security issue”) so the model must infer **sentiment**, **featureArea**, and **urgency** from context. The **Indicator** line is the **expected ground truth** for manual checks when you tune or regress the classifier — borderline items are marked with a short rationale in parentheses.

## 1) Single ingest (`/ingest`)

Paste one text at a time in **Feedback text** and keep source as `web_form`.

1. `The consolidated path bundles what I used to chase across three different surfaces, which is genuinely less draining, yet nothing in the copy tells me what is reversible before I commit, so I still screenshot every time I am about to finalize.`  
   Indicator: `sentiment=positive` | `featureArea=onboarding` | `urgency=low` *(net praise + friction is habit/risk, not outage)*

2. `In our internal runs the same gesture lands instantly before noon and then hitches after lunch whenever the handoff crosses the partner pipe, which makes live triage with CS awkward because we cannot point to a rule — only a mood.`  
   Indicator: `sentiment=neutral` | `featureArea=integrations` | `urgency=medium` *(could be confused with performance; “partner pipe” anchors integrations)*

3. `Leadership keeps asking for one slide that reflects both funnel shape and cohort stickiness; we approximate it by stitching two exports into Sheets, which works until someone renames a segment and the whole story quietly drifts.`  
   Indicator: `sentiment=neutral` | `featureArea=reporting` | `urgency=low`

4. `We are not hitting hard failures — it is more that reconciliation turns into a loop because the default on the saved lens disagrees with what the share link suggests, and that already cost us a slot with finance yesterday evening.`  
   Indicator: `sentiment=negative` | `featureArea=payments` | `urgency=medium` *(reconciliation + finance; lens/share are the surface, not first-run onboarding)*

## 2) Bulk ingest (`/ingest/bulk`)

Paste these lines in the bulk page (one per line).

1. `Visually it is calmer than the old stack and I get to the same outcome with fewer detours; the part that still taxes me is mental — I have to relearn where state lives when I have been away for a sprint.`  
   Indicator: `sentiment=positive` | `featureArea=onboarding` | `urgency=low`

2. `Acknowledgements are not predictable: occasionally they land while I am still in the flow, other times the gap is long enough that I duplicate the attempt even though nothing explicitly failed.`  
   Indicator: `sentiment=neutral` | `featureArea=payments` | `urgency=medium` *(no word “payment”; “acknowledgements / duplicate attempt” implies money movement)*

3. `I genuinely could not tell if the hiccup lived in our browser profile or upstream; walking away and repeating the ritual an hour later behaved normally, so I filed it under “weird Tuesday” rather than opening a ticket.`  
   Indicator: `sentiment=neutral` | `featureArea=other` | `urgency=low`

4. `If annotations lived next to the object instead of living in my personal scratchpad, handoffs to design would stop losing nuance — right now context evaporates the moment someone joins mid-thread.`  
   Indicator: `sentiment=neutral` | `featureArea=integrations` | `urgency=low` *(collaboration/handoffs → integrations; describes broken state + wish, not net praise)*

5. `With a handful of rows the flow feels decisive; once the batch grows, the affordances blur and I find myself undoing because I cannot trust what the last tap actually latched onto.`  
   Indicator: `sentiment=negative` | `featureArea=performance` | `urgency=medium` *(scale + confidence; overlaps onboarding — perf chosen for volume sensitivity)*

6. `Terminology eventually clicks for people who have been in the space for years; for newcomers the first hour is mostly guessing which label is operational versus cosmetic.`  
   Indicator: `sentiment=neutral` | `featureArea=onboarding` | `urgency=low`

7. `I assume there is a faster path buried somewhere because peers mention shortcuts, but my mental map is still the old wizard, so I keep exporting defensively before I explore corners I do not know by name.`  
   Indicator: `sentiment=negative` | `featureArea=reporting` | `urgency=low` *(frustration + export habit; not high urgency)*

8. `Day to day it is workable enough that we ship, but the micro-stalls stack — five seconds here, an unexplained refresh there — and by Friday nobody remembers which annoyance started first.`  
   Indicator: `sentiment=neutral` | `featureArea=performance` | `urgency=medium`

9. `Before quarter close we need the audit trail to line up with what we told the bank; right now the narrative is plausible if you squint, but it will not survive a hostile read.`  
   Indicator: `sentiment=negative` | `featureArea=security` | `urgency=high` *(compliance / audit — test `high` without the word “urgent”)*

## 3) Slack-like ingest via web (`/ingest` with source `slack_like`)

On `/ingest`, change **Source** to `slack_like` and fill:
- `External message ID` with a unique value
- `Channel` and `User display name` (optional)
- `Ingest secret` with your `SLACK_INGEST_SECRET`

Suggested texts:

1. `Sharing because leadership asked for concrete examples: I can produce the artifact, but I only trust it after a manual second pass — the automated checks and my intuition are not in the same place yet.`  
   Indicator: `sentiment=negative` | `featureArea=security` | `urgency=medium` *(trust/verification — not the word “security”)*

2. `Not escalated to incident level, but I keep deferring the cutover step — it is the one place where a typo does not raise its hand until downstream screams.`  
   Indicator: `sentiment=negative` | `featureArea=payments` | `urgency=medium` *(downstream impact implied)*

3. `From the customer call: they can live with the choreography, what erodes trust is the variance — sometimes same-day, sometimes enough lag that they reorganize their week around uncertainty.`  
   Indicator: `sentiment=neutral` | `featureArea=integrations` | `urgency=medium` *(variance + operational impact; “reorganize their week” beats pure low)*

Suggested metadata for quick tests:
- `externalMessageId`: `slack-ts-20260420.200001`, `slack-ts-20260420.200002`, `slack-ts-20260420.200003`
- `channel`: `#product-feedback`
- `userDisplayName`: `CS - Test`

### Idempotency check in web form

Submit one Slack-like entry, then submit again with the **same** `externalMessageId`.

Expected behavior:
- first submit: creates the item (`201`)
- second submit: returns existing item (`200`) and does not create duplicate

## 4) Quick validation checklist

- Dashboard shows varied classification results (not all in one bucket)
- There are records from `web_form`, `web_bulk`, and `slack_like`
- Filters by `source` and `classificationStatus` return consistent rows
- Reusing the same `externalMessageId` does not create a second document
- Spot-check items where **indicator** was deliberately borderline — model output may disagree; use that to refine the prompt, not to assume the UI is wrong
