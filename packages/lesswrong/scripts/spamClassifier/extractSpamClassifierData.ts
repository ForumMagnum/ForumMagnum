import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import * as fs from "fs";

/* eslint-disable no-console */

/**
 * Data extraction for the new-user spam classifier.
 *
 * Labels:
 *   spam (1):     banned IS NOT NULL AND deleteContent IS TRUE  (the mod "purge" action)
 *   not-spam (0): reviewedByUserId IS NOT NULL AND not banned/purged (reviewed & approved)
 * Users in neither bucket (unreviewed, or banned-without-purge) are excluded, since
 * their labels are ambiguous.
 *
 * For each user we dump: username/displayName, bio html, map pin, their earliest
 * posts/comments/tag-revisions (truncated), plus createdAt for splitting.
 * Content is capped at the earliest few items because the deployment scenario is
 * scoring a *new* user at review time.
 *
 * Usage:
 *   yarn repl dev lw packages/lesswrong/scripts/spamClassifier/extractSpamClassifierData.ts "spamClassifierStats()"
 *   yarn repl dev lw packages/lesswrong/scripts/spamClassifier/extractSpamClassifierData.ts "extractSpamClassifierData('/path/to/out.jsonl')"
 */

const DEFAULT_SINCE = "2020-01-01";
const MAX_POSTS = 5;
const MAX_COMMENTS = 20;
const MAX_TAG_REVISIONS = 5;
const HTML_TRUNCATE = 3000;
const BATCH_SIZE = 2000;

const POPULATION_WHERE = `
  u."createdAt" >= $(since)
  AND (
    (u.banned IS NOT NULL AND u."deleteContent" IS TRUE)
    OR (u."reviewedByUserId" IS NOT NULL AND u.banned IS NULL AND u."deleteContent" IS NOT TRUE)
  )
`;

export async function spamClassifierStats(since = DEFAULT_SINCE) {
  const db = getSqlClientOrThrow();
  const overall = await db.one(`
    -- extractSpamClassifierData.stats
    SELECT
      COUNT(*) AS total_users,
      COUNT(*) FILTER (WHERE u.banned IS NOT NULL AND u."deleteContent" IS TRUE) AS purged_spam,
      COUNT(*) FILTER (WHERE u."reviewedByUserId" IS NOT NULL AND u.banned IS NULL AND u."deleteContent" IS NOT TRUE) AS reviewed_approved,
      COUNT(*) FILTER (WHERE u.banned IS NOT NULL AND u."deleteContent" IS NOT TRUE) AS banned_not_purged,
      COUNT(*) FILTER (WHERE u."reviewedByUserId" IS NULL AND u.banned IS NULL) AS unreviewed
    FROM "Users" u
    WHERE u."createdAt" >= $(since)
  `, { since });
  console.log("Overall since", since, ":", JSON.stringify(overall, null, 2));

  const byYear = await db.any(`
    -- extractSpamClassifierData.statsByYear
    SELECT
      date_trunc('year', u."createdAt")::date AS year,
      COUNT(*) FILTER (WHERE u.banned IS NOT NULL AND u."deleteContent" IS TRUE) AS purged_spam,
      COUNT(*) FILTER (WHERE u."reviewedByUserId" IS NOT NULL AND u.banned IS NULL AND u."deleteContent" IS NOT TRUE) AS reviewed_approved
    FROM "Users" u
    WHERE u."createdAt" >= $(since)
    GROUP BY 1 ORDER BY 1
  `, { since });
  console.log("By year:", JSON.stringify(byYear, null, 2));
}

export async function newUsersPerYear() {
  const db = getSqlClientOrThrow();
  const rows = await db.any(`
    -- extractSpamClassifierData.newUsersPerYear
    SELECT
      date_trunc('year', u."createdAt")::date AS year,
      COUNT(*) AS signups,
      COUNT(*) FILTER (WHERE u.banned IS NOT NULL AND u."deleteContent" IS TRUE) AS purged_spam,
      COUNT(*) FILTER (WHERE u."reviewedByUserId" IS NOT NULL AND u.banned IS NULL AND u."deleteContent" IS NOT TRUE) AS reviewed_approved,
      COUNT(*) FILTER (WHERE COALESCE((
        SELECT true FROM "Posts" p WHERE p."userId" = u._id LIMIT 1
      ), (
        SELECT true FROM "Comments" c WHERE c."userId" = u._id LIMIT 1
      ), false)) AS with_content
    FROM "Users" u
    WHERE u."createdAt" >= '2019-01-01'
    GROUP BY 1 ORDER BY 1
  `);
  console.log(JSON.stringify(rows, null, 2));
}

export async function extractSpamClassifierData(outputPath: string, since = DEFAULT_SINCE) {
  const db = getSqlClientOrThrow();
  const out = fs.createWriteStream(outputPath);
  let lastId = "";
  let totalWritten = 0;

  for (;;) {
    const rows = await db.any(`
      -- extractSpamClassifierData.batch
      WITH pop AS (
        SELECT
          u._id,
          u.username,
          u."displayName",
          u."createdAt",
          u."biography"->>'html' AS bio_html,
          u."mapLocation"->>'formatted_address' AS map_location,
          u."mapMarkerText" AS map_marker_text,
          u."signUpReCaptchaRating",
          (u.banned IS NOT NULL AND u."deleteContent" IS TRUE) AS is_spam
        FROM "Users" u
        WHERE ${POPULATION_WHERE}
          AND u._id > $(lastId)
        ORDER BY u._id
        LIMIT $(batchSize)
      )
      SELECT
        p.*,
        posts.j AS posts,
        comments.j AS comments,
        tagrevs.j AS tag_revisions
      FROM pop p
      LEFT JOIN LATERAL (
        SELECT json_agg(x) AS j FROM (
          SELECT po.title, left(r.html, $(htmlTruncate)) AS html, po."createdAt", po.draft, po.status
          FROM "Posts" po
          LEFT JOIN "Revisions" r ON r._id = po."contents_latest"
          WHERE po."userId" = p._id
          ORDER BY po."createdAt" ASC
          LIMIT $(maxPosts)
        ) x
      ) posts ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_agg(x) AS j FROM (
          SELECT left(c."contents"->>'html', $(htmlTruncate)) AS html, c."createdAt", c.deleted
          FROM "Comments" c
          WHERE c."userId" = p._id
          ORDER BY c."createdAt" ASC
          LIMIT $(maxComments)
        ) x
      ) comments ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_agg(x) AS j FROM (
          SELECT left(rv.html, $(htmlTruncate)) AS html, rv."commitMessage", rv."createdAt", rv."collectionName"
          FROM "Revisions" rv
          WHERE rv."userId" = p._id
            AND rv."collectionName" IN ('Tags', 'MultiDocuments')
          ORDER BY rv."createdAt" ASC
          LIMIT $(maxTagRevisions)
        ) x
      ) tagrevs ON TRUE
    `, {
      since,
      lastId,
      batchSize: BATCH_SIZE,
      htmlTruncate: HTML_TRUNCATE,
      maxPosts: MAX_POSTS,
      maxComments: MAX_COMMENTS,
      maxTagRevisions: MAX_TAG_REVISIONS,
    });

    if (rows.length === 0) break;
    for (const row of rows) {
      out.write(JSON.stringify(row) + "\n");
    }
    totalWritten += rows.length;
    lastId = rows[rows.length - 1]._id;
    console.log(`Wrote ${totalWritten} users (last _id: ${lastId})`);
  }

  await new Promise<void>((resolve, reject) => {
    out.on("error", reject);
    out.end(() => resolve());
  });
  console.log(`Done. ${totalWritten} users written to ${outputPath}`);
}
