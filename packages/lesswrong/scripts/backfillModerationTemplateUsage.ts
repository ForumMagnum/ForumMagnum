/* eslint-disable no-console */
import fs from "fs";
import moment from "moment";
import { cheerioParse } from "@/server/utils/htmlUtil";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import ModerationTemplates from "@/server/collections/moderationTemplates/collection";
import LWEvents from "@/server/collections/lwevents/collection";
import { adminAccountSetting } from "@/lib/instanceSettings";
import { MODERATION_TEMPLATE_USED_EVENT } from "@/lib/collections/moderationTemplates/constants";

/**
 * Reconstructs rejection-template usage (MODERATION_TEMPLATE_USED_EVENT
 * LWEvents) for content rejected before that usage started being tracked, by
 * matching each rejected post/comment's rejectedReason against the current
 * rejection templates.
 *
 * Dry run (default; prints per-template match counts and unmatched samples):
 *   yarn repl dev lw packages/lesswrong/scripts/backfillModerationTemplateUsage.ts "backfillModerationTemplateUsage()"
 * Write the events:
 *   yarn repl prod lw packages/lesswrong/scripts/backfillModerationTemplateUsage.ts "backfillModerationTemplateUsage(true)"
 * Save the per-template counts for a dev server to sort by (see
 * MODERATION_TEMPLATE_USAGE_OVERRIDE_PATH in moderationResolvers.ts), without writing to the database:
 *   yarn repl prod lw packages/lesswrong/scripts/backfillModerationTemplateUsage.ts "backfillModerationTemplateUsage(false, 90, '/path/to/counts.json')"
 *
 * Idempotent: content that already has a usage event (live or backfilled) is skipped.
 *
 * There's no rejectedAt field, so the rejection time is taken from the
 * FieldChanges row logged when `rejected` was set, where one exists (rarely;
 * comment updates don't log field changes at all), falling back to the
 * content's postedAt. Where both exist, rejection typically follows posting
 * within a day or two. Automated LLM rejections are skipped, since the live
 * tracking only records templates a moderator picked.
 */

const DEFAULT_WINDOW_DAYS = 90;

// rejectContentForLLM copies the "No LLM (autoreject)" template, which opens with this, into rejectedReason
const AUTOMATED_REJECTION_MARKER = "this is an automated rejection";

// Bold lead-ins shorter than this are too generic to identify a template by
const MIN_LEAD_LENGTH = 8;
const SNIPPET_LENGTH = 80;
const UNMATCHED_SAMPLE_COUNT = 15;

interface TemplateMatcher {
  templateId: string,
  name: string,
  /** Normalized text that identifies the template inside a rejectedReason */
  key: string,
  keyKind: "lead" | "snippet",
  /** The template's normalized text from the key onwards, to tell apart templates sharing a key */
  textFromKey: string,
}

interface RejectedContent {
  _id: string,
  rejectedReason: string,
  rejectedByUserId: string | null,
  postedAt: Date,
  fieldChangeRejectedAt: Date | null,
  fieldChangeUserId: string | null,
}

interface TemplateMatch {
  templateId: string,
  start: number,
  end: number,
}

type RejectableCollectionName = "Posts" | "Comments";

/**
 * Lowercased plain text with entities decoded, typographic quotes and
 * non-breaking spaces flattened, and whitespace collapsed, so that template
 * text survives editor round-trips.
 */
function normalizeText(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function htmlToNormalizedText(html: string): string {
  const $ = cheerioParse(html);
  // Keep block boundaries from gluing words together
  $("p, li, br, h1, h2, h3, h4, h5, h6, div").after(" ");
  return normalizeText($.root().text());
}

/** Same lead as extractBoldLead in RejectContentPanel: the first bold element's text */
function extractNormalizedBoldLead(html: string): string | null {
  const $ = cheerioParse(html);
  const lead = $("strong, b").first().text();
  return lead ? normalizeText(lead) : null;
}

/**
 * Fallback key for templates without a usable bold lead: the start of the
 * longest stretch of text that has no {{placeholders}}, since those are
 * substituted with the recipient's name before the message is sent.
 */
function getSnippet(normalizedText: string): string {
  const longestSegment = normalizedText
    .split(/{{[^}]*}}/)
    .map(segment => segment.trim())
    .reduce((longest, segment) => segment.length > longest.length ? segment : longest, "");
  return longestSegment.slice(0, SNIPPET_LENGTH).trim();
}

function buildTemplateMatcher(template: DbModerationTemplate): TemplateMatcher | null {
  const html = template.contents?.html ?? "";
  const text = htmlToNormalizedText(html);
  const lead = extractNormalizedBoldLead(html);
  const useLead = !!lead && lead.length >= MIN_LEAD_LENGTH;
  const key = useLead ? lead : getSnippet(text);
  if (!key) return null;
  return {
    templateId: template._id,
    name: template.name,
    key,
    keyKind: useLead ? "lead" : "snippet",
    textFromKey: text.slice(Math.max(text.indexOf(key), 0)),
  };
}

function commonPrefixLength(a: string, b: string): number {
  const maxLength = Math.min(a.length, b.length);
  let i = 0;
  while (i < maxLength && a[i] === b[i]) i++;
  return i;
}

/**
 * Returns the ids of the templates whose keys appear in the rejection reason.
 * When several templates share a key (e.g. posts and comments variants of the
 * same reason), only the one whose text continues furthest in agreement with
 * the reason is counted. A match lying entirely inside another template's
 * match is dropped, so e.g. "No LLM generated, assisted/co-written, or edited
 * work." isn't also counted when it only appears as part of the autoreject
 * template's longer lead.
 */
function matchTemplates(normalizedReason: string, matchers: TemplateMatcher[]): string[] {
  const bestMatchByKey = new Map<string, TemplateMatch & { agreement: number }>();
  for (const matcher of matchers) {
    const start = normalizedReason.indexOf(matcher.key);
    if (start === -1) continue;
    const agreement = commonPrefixLength(normalizedReason.slice(start), matcher.textFromKey);
    const existing = bestMatchByKey.get(matcher.key);
    if (!existing || agreement > existing.agreement) {
      bestMatchByKey.set(matcher.key, { templateId: matcher.templateId, start, end: start + matcher.key.length, agreement });
    }
  }
  const matches = [...bestMatchByKey.values()];
  return matches
    .filter(match => !matches.some(other =>
      other !== match
      && other.start <= match.start
      && other.end >= match.end
      && (other.end - other.start) > (match.end - match.start)
    ))
    .map(match => match.templateId);
}

async function getRejectedContent(collectionName: RejectableCollectionName, since: Date): Promise<RejectedContent[]> {
  const db = getSqlClientOrThrow();
  return await db.any<RejectedContent>(`
    -- backfillModerationTemplateUsage.getRejectedContent
    SELECT
      d."_id",
      d."rejectedReason",
      d."rejectedByUserId",
      d."postedAt",
      fc."createdAt" AS "fieldChangeRejectedAt",
      fc."userId" AS "fieldChangeUserId"
    FROM "${collectionName}" d
    LEFT JOIN LATERAL (
      SELECT "createdAt", "userId"
      FROM "FieldChanges"
      WHERE "documentId" = d."_id"
        AND "fieldName" = 'rejected'
        AND "newValue" = 'true'::JSONB
      ORDER BY "createdAt" DESC
      LIMIT 1
    ) fc ON TRUE
    WHERE d."rejected" IS TRUE
      AND d."rejectedReason" IS NOT NULL
      AND COALESCE(fc."createdAt", d."postedAt") > $(since)
  `, { since });
}

async function getContentIdsWithUsageEvents(): Promise<Set<string>> {
  const db = getSqlClientOrThrow();
  const rows = await db.any<{ contentId: string }>(`
    -- backfillModerationTemplateUsage.getContentIdsWithUsageEvents
    SELECT DISTINCT "properties"->>'contentId' AS "contentId"
    FROM "LWEvents"
    WHERE "name" = $(eventName)
      AND "properties"->>'contentId' IS NOT NULL
  `, { eventName: MODERATION_TEMPLATE_USED_EVENT });
  return new Set(rows.map(row => row.contentId));
}

/**
 * Lists templates whose key also appears in a different template's text, where
 * a rejection using the other template could be miscounted as using this one.
 */
function warnAboutAmbiguousKeys(matchers: TemplateMatcher[]) {
  for (const matcher of matchers) {
    const containingTemplates = matchers.filter(other =>
      other.key !== matcher.key
      && other.textFromKey.includes(matcher.key)
      && !other.key.includes(matcher.key)
    );
    if (containingTemplates.length) {
      console.log(`Warning: the key of "${matcher.name}" also appears in: ${containingTemplates.map(other => `"${other.name}"`).join(", ")}`);
    }
  }
}

function isAutomatedRejection(normalizedReason: string, rejectorId: string | null, adminAccountId: string | null): boolean {
  if (!normalizedReason.includes(AUTOMATED_REJECTION_MARKER)) return false;
  return !rejectorId || rejectorId === adminAccountId;
}

function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export async function backfillModerationTemplateUsage(write = false, windowDays = DEFAULT_WINDOW_DAYS, countsOutputPath?: string) {
  const since = moment().subtract(windowDays, "days").toDate();
  const adminAccountId = adminAccountSetting.get("LessWrong")?._id ?? null;

  const templates = await ModerationTemplates.find({ collectionName: "Rejections", deleted: false }).fetch();
  const matchers: TemplateMatcher[] = [];
  for (const template of templates) {
    const matcher = buildTemplateMatcher(template);
    if (matcher) {
      matchers.push(matcher);
    } else {
      console.log(`Template "${template.name}" (${template._id}) has no text to match on; skipping it`);
    }
  }

  warnAboutAmbiguousKeys(matchers);

  const contentIdsWithEvents = await getContentIdsWithUsageEvents();

  const matchCounts = new Map<string, number>(matchers.map(matcher => [matcher.templateId, 0]));
  const matchesPerContentCounts = new Map<number, number>();
  const unmatchedSamples: string[] = [];
  const eventsToInsert: InsertionRecord<DbLWEvent>[] = [];

  for (const collectionName of ["Posts", "Comments"] as const) {
    const rejectedContent = await getRejectedContent(collectionName, since);
    let alreadyBackfilled = 0;
    let automated = 0;
    let matched = 0;
    let unmatched = 0;
    let withFieldChangeTimestamp = 0;

    for (const content of rejectedContent) {
      if (contentIdsWithEvents.has(content._id)) {
        alreadyBackfilled++;
        continue;
      }

      const normalizedReason = htmlToNormalizedText(content.rejectedReason);
      const rejectorId = content.fieldChangeUserId ?? content.rejectedByUserId;
      if (isAutomatedRejection(normalizedReason, rejectorId, adminAccountId)) {
        automated++;
        continue;
      }

      const templateIds = matchTemplates(normalizedReason, matchers);
      matchesPerContentCounts.set(templateIds.length, (matchesPerContentCounts.get(templateIds.length) ?? 0) + 1);
      if (!templateIds.length) {
        unmatched++;
        if (unmatchedSamples.length < UNMATCHED_SAMPLE_COUNT) {
          unmatchedSamples.push(`${collectionName} ${content._id}: ${truncate(normalizedReason, 300)}`);
        }
        continue;
      }

      matched++;
      if (content.fieldChangeRejectedAt) withFieldChangeTimestamp++;
      const rejectedAt = content.fieldChangeRejectedAt ?? content.postedAt;
      for (const templateId of templateIds) {
        matchCounts.set(templateId, (matchCounts.get(templateId) ?? 0) + 1);
        eventsToInsert.push({
          name: MODERATION_TEMPLATE_USED_EVENT,
          documentId: templateId,
          userId: rejectorId,
          createdAt: rejectedAt,
          important: false,
          intercom: false,
          properties: { contentId: content._id, contentCollectionName: collectionName, backfilled: true },
        });
      }
    }

    console.log(`\n${collectionName}: ${rejectedContent.length} rejected since ${since.toISOString()}`);
    console.log(`  already have usage events: ${alreadyBackfilled}`);
    console.log(`  automated LLM rejections (skipped): ${automated}`);
    console.log(`  matched at least one template: ${matched} (${withFieldChangeTimestamp} timestamped from FieldChanges, the rest from postedAt)`);
    console.log(`  unmatched: ${unmatched}`);
  }

  console.log("\nTemplates matched per rejection:");
  for (const [matchesPerContent, count] of [...matchesPerContentCounts.entries()].sort(([a], [b]) => a - b)) {
    console.log(`  ${matchesPerContent}: ${count}`);
  }

  console.log("\nMatches per template:");
  const sortedMatchers = [...matchers].sort((a, b) => (matchCounts.get(b.templateId) ?? 0) - (matchCounts.get(a.templateId) ?? 0));
  for (const matcher of sortedMatchers) {
    console.log(`  ${String(matchCounts.get(matcher.templateId) ?? 0).padStart(5)}  ${matcher.name} [${matcher.keyKind}: "${truncate(matcher.key, 60)}"]`);
  }

  console.log("\nUnmatched samples:");
  for (const sample of unmatchedSamples) {
    console.log(`  ${sample}`);
  }

  if (countsOutputPath) {
    const countsByTemplateId = Object.fromEntries([...matchCounts.entries()].filter(([, count]) => count > 0));
    fs.writeFileSync(countsOutputPath, JSON.stringify(countsByTemplateId, null, 2));
    console.log(`\nWrote counts for ${Object.keys(countsByTemplateId).length} templates to ${countsOutputPath}`);
  }

  if (!write) {
    console.log(`\nDry run: would insert ${eventsToInsert.length} events. Pass true to write them.`);
    return;
  }

  await LWEvents.rawInsertMany(eventsToInsert);
  console.log(`\nInserted ${eventsToInsert.length} events.`);
}
