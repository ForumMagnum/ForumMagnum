import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { REJECTION_TEMPLATE_IDS } from "@/components/sunshineDashboard/supermod/templateHighlightRules";
import { stripHtml } from "@/components/sunshineDashboard/supermod/contentTextHelpers";

interface RejectedItem {
  _id: string;
  isPost: boolean;
  html: string | null;
  url: string | null;
  isEvent: boolean;
  shortform: boolean;
  question: boolean;
  rejectedReason: string | null;
}

const plaintextLength = (html: string | null) =>
  stripHtml(html ?? '').replace(/\s+/g, ' ').trim().length;

async function getTemplateHtml(templateId: string): Promise<string> {
  const db = getSqlClientOrThrow();
  const row = await db.oneOrNone(`
    -- insufficientQualityLengthBacktest.getTemplateHtml
    SELECT t.name, r."html"
    FROM "ModerationTemplates" t
    LEFT JOIN "Revisions" r ON r."_id" = t."contents_latest"
    WHERE t."_id" = $(templateId)
  `, { templateId });
  // eslint-disable-next-line no-console
  console.log(`Template ${templateId}: ${row?.name}\n${row?.html}\n`);
  return row?.html ?? '';
}

async function getRejectedItems(): Promise<RejectedItem[]> {
  const db = getSqlClientOrThrow();
  const posts = await db.any(`
    -- insufficientQualityLengthBacktest.rejectedPosts
    SELECT p."_id", r."html", p."url", p."isEvent", p."shortform", p."question", p."isEvent", p."shortform", p."question", p."rejectedReason"
    FROM "Posts" p
    LEFT JOIN "Revisions" r ON r."_id" = p."contents_latest"
    WHERE p."rejected" IS TRUE AND p."rejectedReason" IS NOT NULL
      AND p."postedAt" > NOW() - INTERVAL '2 years' 
  `);
  const comments = await db.any(`
    -- insufficientQualityLengthBacktest.rejectedComments
    SELECT c."_id", r."html", NULL AS "url", FALSE AS "isEvent", FALSE AS "shortform", FALSE AS "question", FALSE AS "isEvent", FALSE AS "shortform", FALSE AS "question", c."rejectedReason"
    FROM "Comments" c
    LEFT JOIN "Revisions" r ON r."_id" = c."contents_latest"
    WHERE c."rejected" IS TRUE AND c."rejectedReason" IS NOT NULL
      AND c."postedAt" > NOW() - INTERVAL '2 years' 
  `);
  return [
    ...posts.map((p: AnyBecauseHard) => ({ ...p, isPost: true })),
    ...comments.map((c: AnyBecauseHard) => ({ ...c, isPost: false })),
  ];
}

/** Approved content from authors who were unreviewed when they submitted it: the inbox's other half. */
async function getApprovedNewAuthorItems(): Promise<RejectedItem[]> {
  const db = getSqlClientOrThrow();
  const posts = await db.any(`
    -- insufficientQualityLengthBacktest.approvedPosts
    SELECT p."_id", r."html", p."url", p."isEvent", p."shortform", p."question"
    FROM "Posts" p
    JOIN "Users" u ON u."_id" = p."userId"
    LEFT JOIN "Revisions" r ON r."_id" = p."contents_latest"
    WHERE p."rejected" IS NOT TRUE
      AND p."draft" IS NOT TRUE
      AND p."status" = 2
      AND u."reviewedByUserId" IS NOT NULL
      AND u."banned" IS NULL
      AND u."nullifyVotes" IS NOT TRUE
      AND u."deleted" IS NOT TRUE
      AND p."postedAt" > u."createdAt" - INTERVAL '1 day'
      AND p."postedAt" < u."createdAt" + INTERVAL '30 days'
      AND p."postedAt" > NOW() - INTERVAL '2 years'
  `);
  const comments = await db.any(`
    -- insufficientQualityLengthBacktest.approvedComments
    SELECT c."_id", r."html", NULL AS "url", FALSE AS "isEvent", FALSE AS "shortform", FALSE AS "question"
    FROM "Comments" c
    JOIN "Users" u ON u."_id" = c."userId"
    LEFT JOIN "Revisions" r ON r."_id" = c."contents_latest"
    WHERE c."rejected" IS NOT TRUE
      AND c."deleted" IS NOT TRUE
      AND u."reviewedByUserId" IS NOT NULL
      AND u."banned" IS NULL
      AND u."nullifyVotes" IS NOT TRUE
      AND u."deleted" IS NOT TRUE
      AND c."postedAt" > u."createdAt" - INTERVAL '1 day'
      AND c."postedAt" < u."createdAt" + INTERVAL '30 days'
      AND c."postedAt" > NOW() - INTERVAL '2 years'
  `);
  return [
    ...posts.map((p: AnyBecauseHard) => ({ ...p, isPost: true, rejectedReason: null })),
    ...comments.map((c: AnyBecauseHard) => ({ ...c, isPost: false, rejectedReason: null })),
  ];
}

const percentile = (sorted: number[], fraction: number) =>
  sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];

function describe(label: string, lengths: number[]) {
  const sorted = [...lengths].sort((a, b) => a - b);
  // eslint-disable-next-line no-console
  console.log(
    `${label}: n=${sorted.length} p10=${percentile(sorted, 0.1)} p25=${percentile(sorted, 0.25)} ` +
    `median=${percentile(sorted, 0.5)} p75=${percentile(sorted, 0.75)} p90=${percentile(sorted, 0.9)}`
  );
}

function sweep(label: string, positives: number[], negatives: number[], thresholds: number[]) {
  // eslint-disable-next-line no-console
  const baseRate = (100 * positives.length) / (positives.length + negatives.length);
  // eslint-disable-next-line no-console
  console.log(
    `\n${label} (positives=${positives.length}, negatives=${negatives.length}, base rate ${baseRate.toFixed(1)}%)`
  );
  for (const threshold of thresholds) {
    const truePositives = positives.filter(length => length < threshold).length;
    const falsePositives = negatives.filter(length => length < threshold).length;
    const recall = positives.length ? (100 * truePositives) / positives.length : 0;
    const fireRate = negatives.length ? (100 * falsePositives) / negatives.length : 0;
    const precision = truePositives + falsePositives > 0
      ? (100 * truePositives) / (truePositives + falsePositives)
      : 0;
    // eslint-disable-next-line no-console
    console.log(
      `  < ${String(threshold).padStart(5)} chars: recall ${recall.toFixed(1)}% ` +
      `| fires on ${fireRate.toFixed(1)}% of negatives | precision ${precision.toFixed(1)}%`
    );
  }
}

const THRESHOLDS = [100, 200, 300, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000];

export async function insufficientQualityLengthBacktest() {
  const templateHtml = await getTemplateHtml(REJECTION_TEMPLATE_IDS.insufficientQuality);
  const templateText = stripHtml(templateHtml).replace(/\s+/g, ' ').trim();
  if (templateText.length < 40) throw new Error('Template text too short to match against rejection reasons');
  // Match on a distinctive middle chunk, so that reasons that combined several templates still match.
  const needle = templateText.slice(20, 120).toLowerCase();
  // eslint-disable-next-line no-console
  console.log(`Matching rejection reasons containing: "${needle}"\n`);

  const rejected = await getRejectedItems();
  const matches = (item: RejectedItem) =>
    stripHtml(item.rejectedReason ?? '').replace(/\s+/g, ' ').trim().toLowerCase().includes(needle);

  const insufficientQuality = rejected.filter(matches);
  const otherRejections = rejected.filter(item => !matches(item));
  const approved = await getApprovedNewAuthorItems();

  // Linkposts and empty bodies aren't candidates for a length rule at all: an empty-bodied
  // linkpost is the offsite-content template's business, so they'd otherwise swamp the post numbers.
  // Events and shortform container posts are short by nature and routinely approved, so leaving
  // them in would make short posts look like an approval signal rather than a rejection one.
  const isLengthCandidate = (item: RejectedItem) =>
    !item.url && !item.isEvent && !item.shortform;

  const approvedPosts = approved.filter(item => item.isPost);
  // eslint-disable-next-line no-console
  console.log(
    `\nApproved new-author posts: ${approvedPosts.length} total, ` +
    `${approvedPosts.filter(item => item.isEvent).length} events, ` +
    `${approvedPosts.filter(item => item.shortform).length} shortform containers, ` +
    `${approvedPosts.filter(item => item.url).length} linkposts, ` +
    `${approvedPosts.filter(item => plaintextLength(item.html) === 0).length} empty-bodied, ` +
    `${approvedPosts.filter(item => item.question).length} questions`
  );

  for (const [label, isPost] of [['posts', true], ['comments', false]] as const) {
    const select = (items: RejectedItem[]) => items
      .filter(item => item.isPost === isPost && isLengthCandidate(item))
      .map(item => plaintextLength(item.html));
    const positives = select(insufficientQuality);
    const otherRejected = select(otherRejections);
    const approvedLengths = select(approved);

    // eslint-disable-next-line no-console
    console.log(`\n===== ${label.toUpperCase()} =====`);
    describe('insufficient-quality rejections', positives);
    describe('other rejections', otherRejected);
    describe('approved new-author content', approvedLengths);
    sweep(`${label}: vs approved new-author content`, positives, approvedLengths, THRESHOLDS);
    sweep(`${label}: vs other rejections`, positives, otherRejected, THRESHOLDS);
  }
}
