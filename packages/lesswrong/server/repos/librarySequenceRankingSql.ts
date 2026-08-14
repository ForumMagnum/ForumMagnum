/**
 * SQL for the sequences-sorting bake-off candidates, as live sort options on
 * the /library redesign prototype (LIBRARY_RANKING_SORT_OPTIONS in
 * lib/collections/sequences/librarySortOptions.ts).
 *
 * Each mechanism is expressed as a chain of CTEs ending in
 * scores("sequenceId", ...), which SequencesRepo.searchLibrarySequences
 * LEFT JOINs against the filtered sequence list. The score definitions are
 * copied from scripts/sequenceRankingBakeoff.ts (the standalone Phase-1/2
 * comparison harness) — keep the two in sync if constants change. Placeholder
 * constants per the handoff: 70% read-through, top-5 posts, 10-starter and
 * 2-post floors for the completion-rate mechanism, Annual Review percentile
 * floors of 0.99 (winner) / 0.95 (finalist).
 *
 * These queries scan ReadStatuses/pingbacks/etc. with no caching, so they are
 * noticeably slow — acceptable for the Phase-2 review prototype only. Whatever
 * mechanism wins should get a precomputed/denormalized implementation before
 * becoming the real "Recommended" sort.
 */

import { getKarmaInflationSeries } from "../karmaInflation/cache";

/**
 * Shared CTE prefix: the sequence universe and the sequence->post join
 * through Chapters. "A sequence's posts" = distinct public posts across its
 * chapters.
 */
export const LIBRARY_RANKING_SHARED_CTES = `
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

const TOP5_KARMA_CTES = `
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
)`;

const READERS_70_CTES = `
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
)`;

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

const COHORT_SCORES_CTES = `
pctl_ranks AS (
  SELECT sp."sequenceId", ch.karma_pctl,
    row_number() OVER (PARTITION BY sp."sequenceId" ORDER BY ch.karma_pctl DESC) AS rn
  FROM seq_posts sp
  JOIN cohort ch ON ch._id = sp."postId"
),
scores AS (
  SELECT "sequenceId", avg(karma_pctl) AS score
  FROM pctl_ranks
  WHERE rn <= 5
  GROUP BY "sequenceId"
)`;

export interface LibraryRankingSql {
  /** CTE list (appended after the shared sequence/post CTEs) ending in scores("sequenceId", ...) */
  ctes: string;
  /** ORDER BY expressions over the joined scores columns, best-first */
  orderBy: string;
}

const LIBRARY_RANKING_SQL: Record<string, LibraryRankingSql> = {
  // 1. Sum of top-5 post karma
  karma5: {
    ctes: `${TOP5_KARMA_CTES},
scores AS (
  SELECT "sequenceId", score FROM karma
)`,
    orderBy: `scores.score DESC NULLS LAST`,
  },

  // 1b. Sum of top-5 post karma, inflation-adjusted: baseScore times the
  // site's stored karmaInflationSeries multiplier for the post's 28-day
  // posting window (the same series behind the "Top (inflation-adjusted)"
  // post sort / karmaInflationAdjustedScore in lib/collections/posts/views.ts,
  // index clamped to the series bounds the same way). Series values arrive as
  // the $(kiValues)/$(kiStart)/$(kiInterval) params from
  // getLibraryRankingParams.
  karma5Adj: {
    ctes: `adjusted AS (
  SELECT sp."sequenceId",
    p."baseScore" * COALESCE(
      ($(kiValues)::FLOAT8[])[
        LEAST(
          GREATEST(
            FLOOR((EXTRACT(EPOCH FROM p."postedAt") * 1000 - $(kiStart)) / $(kiInterval))::INTEGER,
            0
          ),
          ARRAY_UPPER($(kiValues)::FLOAT8[], 1) - 1
        ) + 1
      ],
      ($(kiValues)::FLOAT8[])[ARRAY_UPPER($(kiValues)::FLOAT8[], 1)]
    ) AS adj_score
  FROM seq_posts sp
  JOIN "Posts" p ON p._id = sp."postId"
),
adj_ranks AS (
  SELECT "sequenceId", adj_score,
    row_number() OVER (PARTITION BY "sequenceId" ORDER BY adj_score DESC) AS rn
  FROM adjusted
),
scores AS (
  SELECT "sequenceId", sum(adj_score) AS score
  FROM adj_ranks
  WHERE rn <= 5
  GROUP BY "sequenceId"
)`,
    orderBy: `scores.score DESC NULLS LAST`,
  },

  // 2. Number of people who opened >=70% of the sequence's posts (all-time)
  readers70: {
    ctes: `${READERS_70_CTES},
scores AS (
  SELECT "sequenceId", n_completers AS score FROM completers
)`,
    orderBy: `scores.score DESC NULLS LAST`,
  },

  // 3. Conjunction of 1 and 2 via rank product (lower = better)
  rankProd: {
    ctes: `${TOP5_KARMA_CTES},
${READERS_70_CTES},
scores AS (
  SELECT s._id AS "sequenceId",
    rank() OVER (ORDER BY COALESCE(k.score, 0) DESC)
      * rank() OVER (ORDER BY COALESCE(c.n_completers, 0) DESC) AS score
  FROM seqs s
  LEFT JOIN karma k ON k."sequenceId" = s._id
  LEFT JOIN completers c ON c."sequenceId" = s._id
)`,
    orderBy: `scores.score ASC NULLS LAST`,
  },

  // 4. Fraction of starters (>=1 post opened) who opened >=70%. Sequences with
  // fewer than 10 starters or fewer than 2 posts (every starter of a 1-post
  // sequence is trivially a completer) fall back to top-5-karma ordering,
  // after all above-floor sequences.
  complRate: {
    ctes: `${TOP5_KARMA_CTES},
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
scores AS (
  SELECT s._id AS "sequenceId",
    (COALESCE(p.n_starters, 0) >= 10 AND COALESCE(p.n_posts, 0) >= 2) AS above_floor,
    CASE WHEN p.n_starters >= 10 AND p.n_posts >= 2
      THEN p.n_completers::float / p.n_starters
    END AS rate,
    COALESCE(k.score, 0) AS karma
  FROM seqs s
  LEFT JOIN per_seq p ON p."sequenceId" = s._id
  LEFT JOIN karma k ON k."sequenceId" = s._id
)`,
    orderBy: `scores.above_floor DESC NULLS LAST, scores.rate DESC NULLS LAST, scores.karma DESC NULLS LAST`,
  },

  // 5. Top-5 mean of same-calendar-year karma percentiles
  cohortPctl: {
    ctes: `${COHORT_CTE},
${COHORT_SCORES_CTES}`,
    orderBy: `scores.score DESC NULLS LAST`,
  },

  // 6. Mechanism 5, but Annual Review winners (a ReviewWinners row) have their
  // percentile floored at 0.99 and finalists (net-positive
  // finalReviewVoteScoreAllKarma, not a winner) at 0.95 before aggregating.
  cohortRevFloor: {
    ctes: `${COHORT_CTE},
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
),
scores AS (
  SELECT "sequenceId", avg(karma_pctl) AS score
  FROM pctl_ranks
  WHERE rn <= 5
  GROUP BY "sequenceId"
)`,
    orderBy: `scores.score DESC NULLS LAST`,
  },

  // 7. Pingbacks into the sequence's posts from public posts outside the
  // sequence (source->target pairs; posts store outbound links in
  // pingbacks->'Posts', so unnest and reverse).
  inLinks: {
    ctes: `links AS (
  SELECT p._id AS "sourceId", t.value AS "targetId"
  FROM "Posts" p
  CROSS JOIN LATERAL jsonb_array_elements_text(p."pingbacks"->'Posts') AS t(value)
  WHERE jsonb_typeof(p."pingbacks"->'Posts') = 'array'
    AND p."draft" IS FALSE AND p."status" = 2 AND p."deletedDraft" IS FALSE
),
scores AS (
  SELECT sp."sequenceId", count(*) AS score
  FROM seq_posts sp
  JOIN links l ON l."targetId" = sp."postId"
  WHERE NOT EXISTS (
    SELECT 1 FROM seq_posts sp2
    WHERE sp2."sequenceId" = sp."sequenceId" AND sp2."postId" = l."sourceId"
  )
  GROUP BY sp."sequenceId"
)`,
    orderBy: `scores.score DESC NULLS LAST`,
  },

  // 8. Active bookmarks on the sequence's posts, plus bookmarks on the
  // sequence itself.
  bookmarks: {
    ctes: `scores AS (
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
)`,
    orderBy: `scores.score DESC NULLS LAST`,
  },
};

export const getLibraryRankingSql = (sortBy: string | null): LibraryRankingSql | null =>
  sortBy ? LIBRARY_RANKING_SQL[sortBy] ?? null : null;

/**
 * Query params a ranking mechanism's SQL needs beyond the shared ones.
 * karma5Adj gets the cached karmaInflationSeries (per-28-day-window
 * multipliers, reciprocal of the window's mean post karma).
 */
export const getLibraryRankingParams = async (sortBy: string | null): Promise<Record<string, unknown>> => {
  if (sortBy === "karma5Adj") {
    const series = await getKarmaInflationSeries();
    return {kiValues: series.values, kiStart: series.start, kiInterval: series.interval};
  }
  return {};
};
