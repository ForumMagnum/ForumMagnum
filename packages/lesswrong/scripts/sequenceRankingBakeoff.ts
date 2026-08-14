import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import * as fs from "fs";

/**
 * Phase-1/Phase-2 tooling for the Library sequences-ranking bake-off.
 *
 * Implements the candidate "dumb rule" sorts from the sequences-sorting
 * handoff (Carolanne + Ruby, 2026-08-13/14) as standalone SQL queries, runs
 * them all, and dumps a side-by-side comparison for the Phase-2 review:
 *   - top 30 sequences per mechanism (printed)
 *   - where each currently-curated sequence lands under each mechanism (printed)
 *   - Spearman rank correlation of each mechanism vs the old curated ordering
 *     (sanity number only; the eyeball test is the real gate)
 *   - a combined CSV over all sequences x all mechanisms (for spreadsheet use)
 *
 * Run with:
 *   yarn repl dev lw packages/lesswrong/scripts/sequenceRankingBakeoff.ts "sequenceRankingBakeoff()"
 * Optionally pass a CSV output path: "sequenceRankingBakeoff('.context/sequence-ranking-bakeoff.csv')"
 *
 * Every candidate query is self-contained SQL (no parameters) so it can also
 * be pasted directly into psql. Each returns one row per sequence in the
 * universe (non-deleted, non-draft), ordered best-first; rank = row position.
 *
 * Placeholder constants (per the handoff these just need to be stated, not
 * tuned): read-through threshold 70%, top-5 posts per sequence, minimum 10
 * starters and minimum 2 posts for the completion-rate mechanism, Annual
 * Review percentile floors of 0.99 (winner) / 0.95 (finalist).
 *
 * Interpretation choices made here (flag in review if they look wrong):
 *   - "Sequence's posts" = distinct posts across the sequence's chapters that
 *     are public (status=2, not draft, not deletedDraft).
 *   - "Winner" = has a row in ReviewWinners; "finalist" = non-winner with
 *     finalReviewVoteScoreAllKarma > 0 (got net-positive final-phase votes).
 *   - Inbound links exclude links from posts inside the same sequence
 *     (sequences habitually interlink their own posts), and count
 *     source->target pairs, not distinct source posts.
 *   - Mechanism 4 requires >=10 starters AND >=2 posts (every starter of a
 *     1-post sequence is trivially a completer, so 1-post sequences would all
 *     score 1.0 and bury everything else); sequences below either floor rank
 *     after all above-floor sequences, ordered by top-5 karma sum.
 *   - Karma cohorts (mechanisms 5/6) = public non-event, non-shortform posts,
 *     partitioned by calendar year of postedAt (UTC).
 *   - Both baselines are computed over the same full universe as the
 *     candidates — including hidden sequences and ignoring the old views'
 *     gridImageId / canonicalCollectionSlug filters — so global ranks are
 *     comparable across mechanisms.
 *   - The Spearman number is computed over the curated set only (curatedOrder
 *     defines no order for the rest), with both orderings re-ranked within
 *     that subset.
 */

/**
 * Shared CTE prefix: the sequence universe and the sequence->post join
 * through Chapters. Inlined into every query so each stays standalone.
 */
const SEQ_POSTS_CTE = `
  seqs AS (
    SELECT _id
    FROM "Sequences"
    WHERE "isDeleted" IS FALSE AND "draft" IS FALSE
  ),
  seq_posts AS (
    SELECT DISTINCT c."sequenceId", p._id AS "postId"
    FROM seqs s
    JOIN "Chapters" c ON c."sequenceId" = s._id
    JOIN "Posts" p ON p._id = ANY(c."postIds")
    WHERE p."draft" IS FALSE AND p."status" = 2 AND p."deletedDraft" IS FALSE
  )`;

const TOP5_KARMA_SUM_SQL = `
-- sequenceRankingBakeoff.top5KarmaSum
WITH ${SEQ_POSTS_CTE},
post_ranks AS (
  SELECT sp."sequenceId", p."baseScore",
    row_number() OVER (PARTITION BY sp."sequenceId" ORDER BY p."baseScore" DESC) AS rn
  FROM seq_posts sp
  JOIN "Posts" p ON p._id = sp."postId"
)
SELECT s._id AS "sequenceId", COALESCE(t.score, 0) AS score
FROM seqs s
LEFT JOIN (
  SELECT "sequenceId", sum("baseScore") AS score
  FROM post_ranks
  WHERE rn <= 5
  GROUP BY "sequenceId"
) t ON t."sequenceId" = s._id
ORDER BY score DESC, s._id
`;

const READERS_70_PCT_SQL = `
-- sequenceRankingBakeoff.readers70pct
WITH ${SEQ_POSTS_CTE},
seq_sizes AS (
  SELECT "sequenceId", count(*) AS n_posts
  FROM seq_posts
  GROUP BY "sequenceId"
),
reads_per_user AS (
  SELECT sp."sequenceId", rs."userId", count(DISTINCT rs."postId") AS n_read
  FROM seq_posts sp
  JOIN "ReadStatuses" rs ON rs."postId" = sp."postId" AND rs."isRead" IS TRUE
  GROUP BY sp."sequenceId", rs."userId"
),
completers AS (
  SELECT r."sequenceId", count(*) AS n_completers
  FROM reads_per_user r
  JOIN seq_sizes z ON z."sequenceId" = r."sequenceId"
  WHERE r.n_read >= ceil(0.7 * z.n_posts)
  GROUP BY r."sequenceId"
)
SELECT s._id AS "sequenceId", COALESCE(c.n_completers, 0) AS score
FROM seqs s
LEFT JOIN completers c ON c."sequenceId" = s._id
ORDER BY score DESC, s._id
`;

const RANK_PRODUCT_SQL = `
-- sequenceRankingBakeoff.rankProductKarmaXReaders
-- Conjunction of top5KarmaSum and readers70pct via rank product (lower = better).
WITH ${SEQ_POSTS_CTE},
post_ranks AS (
  SELECT sp."sequenceId", p."baseScore",
    row_number() OVER (PARTITION BY sp."sequenceId" ORDER BY p."baseScore" DESC) AS rn
  FROM seq_posts sp
  JOIN "Posts" p ON p._id = sp."postId"
),
karma AS (
  SELECT "sequenceId", sum("baseScore") AS score
  FROM post_ranks
  WHERE rn <= 5
  GROUP BY "sequenceId"
),
seq_sizes AS (
  SELECT "sequenceId", count(*) AS n_posts
  FROM seq_posts
  GROUP BY "sequenceId"
),
reads_per_user AS (
  SELECT sp."sequenceId", rs."userId", count(DISTINCT rs."postId") AS n_read
  FROM seq_posts sp
  JOIN "ReadStatuses" rs ON rs."postId" = sp."postId" AND rs."isRead" IS TRUE
  GROUP BY sp."sequenceId", rs."userId"
),
completers AS (
  SELECT r."sequenceId", count(*) AS n_completers
  FROM reads_per_user r
  JOIN seq_sizes z ON z."sequenceId" = r."sequenceId"
  WHERE r.n_read >= ceil(0.7 * z.n_posts)
  GROUP BY r."sequenceId"
),
combined AS (
  SELECT s._id AS "sequenceId",
    rank() OVER (ORDER BY COALESCE(k.score, 0) DESC) AS karma_rank,
    rank() OVER (ORDER BY COALESCE(c.n_completers, 0) DESC) AS reader_rank
  FROM seqs s
  LEFT JOIN karma k ON k."sequenceId" = s._id
  LEFT JOIN completers c ON c."sequenceId" = s._id
)
SELECT "sequenceId", karma_rank * reader_rank AS score
FROM combined
ORDER BY score ASC, "sequenceId"
`;

const COMPLETION_RATE_SQL = `
-- sequenceRankingBakeoff.completionRate70pct
-- Fraction of starters (>=1 post opened) who opened >=70% of posts. Sequences
-- with fewer than 10 starters or fewer than 2 posts (every starter of a
-- 1-post sequence is trivially a completer) fall back to top-5-karma
-- ordering, after all above-floor sequences.
WITH ${SEQ_POSTS_CTE},
seq_sizes AS (
  SELECT "sequenceId", count(*) AS n_posts
  FROM seq_posts
  GROUP BY "sequenceId"
),
reads_per_user AS (
  SELECT sp."sequenceId", rs."userId", count(DISTINCT rs."postId") AS n_read
  FROM seq_posts sp
  JOIN "ReadStatuses" rs ON rs."postId" = sp."postId" AND rs."isRead" IS TRUE
  GROUP BY sp."sequenceId", rs."userId"
),
per_seq AS (
  SELECT z."sequenceId", z.n_posts,
    count(r."userId") AS n_starters,
    count(r."userId") FILTER (WHERE r.n_read >= ceil(0.7 * z.n_posts)) AS n_completers
  FROM seq_sizes z
  LEFT JOIN reads_per_user r ON r."sequenceId" = z."sequenceId"
  GROUP BY z."sequenceId", z.n_posts
),
post_ranks AS (
  SELECT sp."sequenceId", p."baseScore",
    row_number() OVER (PARTITION BY sp."sequenceId" ORDER BY p."baseScore" DESC) AS rn
  FROM seq_posts sp
  JOIN "Posts" p ON p._id = sp."postId"
),
karma AS (
  SELECT "sequenceId", sum("baseScore") AS score
  FROM post_ranks
  WHERE rn <= 5
  GROUP BY "sequenceId"
)
SELECT s._id AS "sequenceId",
  CASE WHEN p.n_starters >= 10 AND p.n_posts >= 2
    THEN round(p.n_completers::numeric / p.n_starters, 4)
  END AS score
FROM seqs s
LEFT JOIN per_seq p ON p."sequenceId" = s._id
LEFT JOIN karma k ON k."sequenceId" = s._id
ORDER BY
  (COALESCE(p.n_starters, 0) >= 10 AND COALESCE(p.n_posts, 0) >= 2) DESC,
  CASE WHEN p.n_starters >= 10 AND p.n_posts >= 2
    THEN p.n_completers::float / p.n_starters
  END DESC NULLS LAST,
  COALESCE(k.score, 0) DESC,
  s._id
`;

/**
 * Karma-percentile cohort CTE: each public post's percent_rank of baseScore
 * among posts published the same calendar year (the karma-inflation fix).
 */
const COHORT_CTE = `
  cohort AS (
    SELECT _id,
      percent_rank() OVER (
        PARTITION BY date_part('year', "postedAt" AT TIME ZONE 'UTC')
        ORDER BY "baseScore"
      ) AS karma_pctl
    FROM "Posts"
    WHERE "draft" IS FALSE AND "status" = 2 AND "deletedDraft" IS FALSE
      AND "isEvent" IS FALSE AND "shortform" IS FALSE
  )`;

const COHORT_PERCENTILE_SQL = `
-- sequenceRankingBakeoff.top5CohortPercentile
WITH ${SEQ_POSTS_CTE},
${COHORT_CTE},
pctl_ranks AS (
  SELECT sp."sequenceId", ch.karma_pctl,
    row_number() OVER (PARTITION BY sp."sequenceId" ORDER BY ch.karma_pctl DESC) AS rn
  FROM seq_posts sp
  JOIN cohort ch ON ch._id = sp."postId"
)
SELECT s._id AS "sequenceId", round(t.score::numeric, 4) AS score
FROM seqs s
LEFT JOIN (
  SELECT "sequenceId", avg(karma_pctl) AS score
  FROM pctl_ranks
  WHERE rn <= 5
  GROUP BY "sequenceId"
) t ON t."sequenceId" = s._id
ORDER BY score DESC NULLS LAST, s._id
`;

const COHORT_PERCENTILE_REVIEW_FLOORS_SQL = `
-- sequenceRankingBakeoff.top5CohortPercentileReviewFloors
-- Same as top5CohortPercentile, but Annual Review winners (a ReviewWinners
-- row) have their percentile floored at 0.99 and finalists (net-positive
-- finalReviewVoteScoreAllKarma, not a winner) at 0.95 before aggregating.
WITH ${SEQ_POSTS_CTE},
${COHORT_CTE},
floored AS (
  SELECT ch._id,
    CASE
      WHEN w."postId" IS NOT NULL THEN GREATEST(ch.karma_pctl, 0.99)
      WHEN p."finalReviewVoteScoreAllKarma" > 0 THEN GREATEST(ch.karma_pctl, 0.95)
      ELSE ch.karma_pctl
    END AS karma_pctl
  FROM cohort ch
  JOIN "Posts" p ON p._id = ch._id
  LEFT JOIN "ReviewWinners" w ON w."postId" = ch._id
),
pctl_ranks AS (
  SELECT sp."sequenceId", f.karma_pctl,
    row_number() OVER (PARTITION BY sp."sequenceId" ORDER BY f.karma_pctl DESC) AS rn
  FROM seq_posts sp
  JOIN floored f ON f._id = sp."postId"
)
SELECT s._id AS "sequenceId", round(t.score::numeric, 4) AS score
FROM seqs s
LEFT JOIN (
  SELECT "sequenceId", avg(karma_pctl) AS score
  FROM pctl_ranks
  WHERE rn <= 5
  GROUP BY "sequenceId"
) t ON t."sequenceId" = s._id
ORDER BY score DESC NULLS LAST, s._id
`;

const INBOUND_LINKS_SQL = `
-- sequenceRankingBakeoff.inboundLinks
-- Pingbacks into the sequence's posts from public posts outside the sequence.
-- Posts store outbound links in pingbacks->'Posts', so we unnest and reverse.
WITH ${SEQ_POSTS_CTE},
links AS (
  SELECT p._id AS "sourceId", t.value AS "targetId"
  FROM "Posts" p
  CROSS JOIN LATERAL jsonb_array_elements_text(p."pingbacks"->'Posts') AS t(value)
  WHERE jsonb_typeof(p."pingbacks"->'Posts') = 'array'
    AND p."draft" IS FALSE AND p."status" = 2 AND p."deletedDraft" IS FALSE
)
SELECT s._id AS "sequenceId", COALESCE(t.score, 0) AS score
FROM seqs s
LEFT JOIN (
  SELECT sp."sequenceId", count(*) AS score
  FROM seq_posts sp
  JOIN links l ON l."targetId" = sp."postId"
  WHERE NOT EXISTS (
    SELECT 1 FROM seq_posts sp2
    WHERE sp2."sequenceId" = sp."sequenceId" AND sp2."postId" = l."sourceId"
  )
  GROUP BY sp."sequenceId"
) t ON t."sequenceId" = s._id
ORDER BY score DESC, s._id
`;

const BOOKMARKS_SQL = `
-- sequenceRankingBakeoff.bookmarks
-- Active bookmarks on the sequence's posts, plus bookmarks on the sequence
-- itself (if any exist).
WITH ${SEQ_POSTS_CTE}
SELECT s._id AS "sequenceId",
  COALESCE(pb.score, 0) + COALESCE(sb.score, 0) AS score
FROM seqs s
LEFT JOIN (
  SELECT sp."sequenceId", count(*) AS score
  FROM seq_posts sp
  JOIN "Bookmarks" b ON b."documentId" = sp."postId"
    AND b."collectionName" = 'Posts' AND b."active" IS TRUE
  GROUP BY sp."sequenceId"
) pb ON pb."sequenceId" = s._id
LEFT JOIN (
  SELECT "documentId", count(*) AS score
  FROM "Bookmarks"
  WHERE "collectionName" = 'Sequences' AND "active" IS TRUE
  GROUP BY "documentId"
) sb ON sb."documentId" = s._id
ORDER BY score DESC, s._id
`;

const BASELINE_CURATED_SQL = `
-- sequenceRankingBakeoff.baselineCurated
-- The old Library ordering, merged: curated section (curatedOrder DESC) first,
-- then everything else newest-first. Comparison only, not a candidate.
-- Unlike the real old views, computed over the full bake-off universe (hidden
-- and imageless sequences included) so ranks line up across mechanisms.
SELECT _id AS "sequenceId", "curatedOrder" AS score
FROM "Sequences"
WHERE "isDeleted" IS FALSE AND "draft" IS FALSE
ORDER BY "curatedOrder" DESC NULLS LAST, "createdAt" DESC, _id
`;

const BASELINE_NEWEST_SQL = `
-- sequenceRankingBakeoff.baselineNewest
-- The old community-section sort, over the full bake-off universe (the real
-- view also excluded curated, canonical-collection, hidden, and imageless
-- sequences). Comparison only, not a candidate.
SELECT _id AS "sequenceId", round(extract(epoch FROM "createdAt")) AS score
FROM "Sequences"
WHERE "isDeleted" IS FALSE AND "draft" IS FALSE
ORDER BY "createdAt" DESC, _id
`;

const SEQUENCE_INFO_SQL = `
-- sequenceRankingBakeoff.sequenceInfo
WITH ${SEQ_POSTS_CTE}
SELECT s._id AS "sequenceId", sq.title, sq."createdAt", sq."curatedOrder",
  sq.hidden, sq."canonicalCollectionSlug",
  (sq."gridImageId" IS NOT NULL) AS "hasGridImage",
  u."displayName" AS author,
  COALESCE(pc.n_posts, 0) AS "postsCount",
  COALESCE(st.n_starters, 0) AS "startersCount"
FROM seqs s
JOIN "Sequences" sq ON sq._id = s._id
LEFT JOIN "Users" u ON u._id = sq."userId"
LEFT JOIN (
  SELECT "sequenceId", count(*) AS n_posts
  FROM seq_posts
  GROUP BY "sequenceId"
) pc ON pc."sequenceId" = s._id
LEFT JOIN (
  SELECT sp."sequenceId", count(DISTINCT rs."userId") AS n_starters
  FROM seq_posts sp
  JOIN "ReadStatuses" rs ON rs."postId" = sp."postId" AND rs."isRead" IS TRUE
  GROUP BY sp."sequenceId"
) st ON st."sequenceId" = s._id
`;

interface MechanismSpec {
  key: string;
  label: string;
  sql: string;
  isBaseline?: boolean;
}

const MECHANISMS: MechanismSpec[] = [
  {key: "karma5", label: "1. Sum of top-5 post karma", sql: TOP5_KARMA_SUM_SQL},
  {key: "readers70", label: "2. Number of people who opened >=70% of posts (all-time)", sql: READERS_70_PCT_SQL},
  {key: "rankProd", label: "3. Conjunction of 1 and 2 (rank product; lower score = better)", sql: RANK_PRODUCT_SQL},
  {key: "complRate", label: "4. Fraction of starters who opened >=70% (min 10 starters & 2 posts, else karma-ordered below floors)", sql: COMPLETION_RATE_SQL},
  {key: "cohortPctl", label: "5. Top-5 mean of same-calendar-year karma percentiles", sql: COHORT_PERCENTILE_SQL},
  {key: "cohortRevFloor", label: "6. Mechanism 5 with Annual Review floors (winner 0.99, finalist 0.95)", sql: COHORT_PERCENTILE_REVIEW_FLOORS_SQL},
  {key: "inLinks", label: "7. Inbound-link count (pingbacks from posts outside the sequence)", sql: INBOUND_LINKS_SQL},
  {key: "bookmarks", label: "8. Bookmark count (sequence's posts + the sequence itself)", sql: BOOKMARKS_SQL},
  {key: "oldCurated", label: "Baseline: old curated ordering (curatedOrder DESC, then newest)", sql: BASELINE_CURATED_SQL, isBaseline: true},
  {key: "newest", label: "Baseline: newest-first (createdAt DESC)", sql: BASELINE_NEWEST_SQL, isBaseline: true},
];

interface MechanismRow {
  sequenceId: string;
  score: number | string | null;
}

interface SequenceInfoRow {
  sequenceId: string;
  title: string;
  createdAt: Date;
  curatedOrder: number | null;
  hidden: boolean;
  canonicalCollectionSlug: string | null;
  hasGridImage: boolean;
  author: string | null;
  postsCount: number | string;
  startersCount: number | string;
}

interface MechanismResult {
  spec: MechanismSpec;
  rows: MechanismRow[];
  /** sequenceId -> 1-based rank (row position, best first) */
  ranks: Map<string, number>;
  /** sequenceId -> raw score */
  scores: Map<string, number | string | null>;
}

function buildResult(spec: MechanismSpec, rows: MechanismRow[]): MechanismResult {
  const ranks = new Map<string, number>();
  const scores = new Map<string, number | string | null>();
  rows.forEach((row, i) => {
    ranks.set(row.sequenceId, i + 1);
    scores.set(row.sequenceId, row.score);
  });
  return {spec, rows, ranks, scores};
}

/**
 * Spearman rank correlation between the baseline's ordering of `ids` and the
 * mechanism's ordering of the same ids. `ids` must be in baseline order;
 * both rank vectors are re-ranked within the subset, so ties don't arise.
 */
function spearmanVsBaseline(ids: string[], mechanismRanks: Map<string, number>): number | null {
  const known = ids.filter(id => mechanismRanks.has(id));
  const n = known.length;
  if (n < 2) return null;
  const byMechanism = [...known].sort((a, b) => mechanismRanks.get(a)! - mechanismRanks.get(b)!);
  const mechSubsetRank = new Map<string, number>();
  byMechanism.forEach((id, i) => mechSubsetRank.set(id, i + 1));
  let sumSquaredDiffs = 0;
  known.forEach((id, i) => {
    const d = (i + 1) - mechSubsetRank.get(id)!;
    sumSquaredDiffs += d * d;
  });
  return 1 - (6 * sumSquaredDiffs) / (n * (n * n - 1));
}

function formatScore(score: number | string | null): string {
  if (score === null || score === undefined) return "-";
  const n = Number(score);
  if (Number.isNaN(n)) return String(score);
  return Number.isInteger(n) ? String(n) : n.toFixed(4);
}

function padColumns(cells: string[], widths: number[]): string {
  return cells.map((cell, i) => cell.padEnd(widths[i])).join("  ");
}

function truncate(s: string, maxLength: number): string {
  return s.length <= maxLength ? s : s.slice(0, maxLength - 1) + "…";
}

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* eslint-disable no-console */

function printTop30(result: MechanismResult, info: Map<string, SequenceInfoRow>): void {
  console.log(`\n=== ${result.spec.label} — top 30 ===`);
  const header = ["rank", "score", "posts", "starters", "year", "cur", "title", "author"];
  const widths = [4, 10, 5, 8, 4, 3, 62, 24];
  console.log(padColumns(header, widths));
  for (const [i, row] of result.rows.slice(0, 30).entries()) {
    const seq = info.get(row.sequenceId);
    if (!seq) continue;
    console.log(padColumns([
      String(i + 1),
      formatScore(row.score),
      String(seq.postsCount),
      String(seq.startersCount),
      String(new Date(seq.createdAt).getFullYear()),
      seq.curatedOrder !== null ? "★" : "",
      truncate(seq.title, 62),
      truncate(seq.author ?? "", 24),
    ], widths));
  }
}

function printCuratedLanding(
  curatedIds: string[],
  results: MechanismResult[],
  info: Map<string, SequenceInfoRow>,
  universeSize: number,
): void {
  console.log(`\n=== Where each currently-curated sequence lands (global rank out of ${universeSize}) ===`);
  const keys = results.map(r => r.spec.key);
  const widths = [4, 46, ...keys.map(k => Math.max(k.length, 5))];
  console.log(padColumns(["old", "title", ...keys], widths));
  for (const [i, id] of curatedIds.entries()) {
    const seq = info.get(id);
    if (!seq) continue;
    const cells = [String(i + 1), truncate(seq.title, 46)];
    for (const result of results) {
      const rank = result.ranks.get(id);
      cells.push(rank !== undefined ? String(rank) : "-");
    }
    console.log(padColumns(cells, widths));
  }
}

function writeCombinedCsv(
  path: string,
  universe: SequenceInfoRow[],
  results: MechanismResult[],
): void {
  const header = [
    "sequenceId", "title", "author", "url", "createdAt", "postsCount",
    "startersCount", "curatedOrder", "hidden", "canonicalCollectionSlug", "hasGridImage",
    ...results.flatMap(r => [`${r.spec.key}Rank`, `${r.spec.key}Score`]),
  ];
  const lines = [header.map(csvEscape).join(",")];
  for (const seq of universe) {
    const cells: (string | number | boolean | null)[] = [
      seq.sequenceId,
      seq.title,
      seq.author,
      `https://www.lesswrong.com/s/${seq.sequenceId}`,
      new Date(seq.createdAt).toISOString().slice(0, 10),
      String(seq.postsCount),
      String(seq.startersCount),
      seq.curatedOrder,
      seq.hidden,
      seq.canonicalCollectionSlug,
      seq.hasGridImage,
    ];
    for (const result of results) {
      const rank = result.ranks.get(seq.sequenceId);
      cells.push(rank !== undefined ? rank : null);
      const score = result.scores.get(seq.sequenceId);
      cells.push(score !== undefined && score !== null ? String(score) : null);
    }
    lines.push(cells.map(csvEscape).join(","));
  }
  fs.writeFileSync(path, lines.join("\n") + "\n");
}

export async function sequenceRankingBakeoff(csvOutputPath = "sequence-ranking-bakeoff.csv") {
  const db = getSqlClientOrThrow();

  console.log("Sequence-ranking bake-off");
  console.log("Universe: Sequences with isDeleted=false AND draft=false (canonical-collection and imageless sequences included)");
  console.log("Constants: read-through threshold 70%; top-5 posts; min starters 10 & min posts 2 (mechanism 4); review floors winner=0.99, finalist=0.95");
  console.log("Post filter (everywhere): status=2, draft=false, deletedDraft=false; 'read' means opened (noisy-optimistic)\n");

  const infoRows = await db.any<SequenceInfoRow>(SEQUENCE_INFO_SQL);
  const info = new Map(infoRows.map(row => [row.sequenceId, row]));

  const results: MechanismResult[] = [];
  for (const spec of MECHANISMS) {
    const startedAt = Date.now();
    const rows = await db.any<MechanismRow>(spec.sql);
    console.log(`[${spec.key}] ${rows.length} rows in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    results.push(buildResult(spec, rows));
  }

  for (const result of results) {
    printTop30(result, info);
  }

  const curatedIds = infoRows
    .filter(row => row.curatedOrder !== null)
    .sort((a, b) => (Number(b.curatedOrder) - Number(a.curatedOrder)) ||
      (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    .map(row => row.sequenceId);
  printCuratedLanding(curatedIds, results, info, infoRows.length);

  console.log("\n=== Spearman rank correlation vs old curated ordering (over the curated set; sanity number only) ===");
  for (const result of results) {
    if (result.spec.isBaseline) continue;
    const rho = spearmanVsBaseline(curatedIds, result.ranks);
    console.log(`${result.spec.key.padEnd(16)} ${rho === null ? "n/a" : rho.toFixed(3)}`);
  }

  writeCombinedCsv(csvOutputPath, infoRows, results);
  console.log(`\nCombined CSV (all ${infoRows.length} sequences x all mechanisms): ${csvOutputPath}`);
}

export default sequenceRankingBakeoff;
