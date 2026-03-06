/* eslint-disable no-console */
import Revisions from "../collections/revisions/collection";
import { dataToWordCount } from "../editor/conversionUtils";
import { getViewablePostsSelector } from "../repos/helpers";
import { runSqlQuery } from "../sql/sqlClient";
import { createAnonymousContext } from "../vulcan-lib/createContexts";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";

interface PublicPostLatestRevisionRow {
  postId: string;
  revisionId: string;
}

interface RecomputePublicPostWordCountsOptions {
  dryRun?: boolean;
  batchSize?: number;
  concurrency?: number;
  maxPosts?: number;
}

interface RecomputeCounts {
  scannedPosts: number;
  updatedRevisions: number;
  unchangedRevisions: number;
  missingRevisions: number;
  missingOriginalContents: number;
  erroredRevisions: number;
}

const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_CONCURRENCY = 4;

function getBatchQuery(): string {
  return `
    SELECT
      p._id AS "postId",
      p."contents_latest" AS "revisionId"
    FROM "Posts" p
    WHERE
      ${getViewablePostsSelector("p")}
      AND p."contents_latest" IS NOT NULL
      AND p._id > $1
    ORDER BY p._id ASC
    LIMIT $2
  `;
}

async function getPublicPostLatestRevisionBatch(lastSeenPostId: string, batchSize: number): Promise<PublicPostLatestRevisionRow[]> {
  return await runSqlQuery(getBatchQuery(), [lastSeenPostId, batchSize]);
}

async function recomputeSingleRevisionWordCount({
  revisionId,
  context,
  dryRun,
}: {
  revisionId: string;
  context: ResolverContext;
  dryRun: boolean;
}): Promise<Pick<RecomputeCounts, "updatedRevisions" | "unchangedRevisions" | "missingRevisions" | "missingOriginalContents" | "erroredRevisions">> {
  const revision = await Revisions.findOne(
    { _id: revisionId },
    {},
    { _id: 1, wordCount: 1, originalContents: 1 },
  );

  if (!revision) {
    return {
      updatedRevisions: 0,
      unchangedRevisions: 0,
      missingRevisions: 1,
      missingOriginalContents: 0,
      erroredRevisions: 0,
    };
  }

  if (!revision.originalContents) {
    return {
      updatedRevisions: 0,
      unchangedRevisions: 0,
      missingRevisions: 0,
      missingOriginalContents: 1,
      erroredRevisions: 0,
    };
  }

  try {
    const computedWordCount = await dataToWordCount(
      revision.originalContents.data,
      revision.originalContents.type,
      context,
    );
    const existingWordCount = revision.wordCount ?? 0;
    if (computedWordCount === existingWordCount) {
      return {
        updatedRevisions: 0,
        unchangedRevisions: 1,
        missingRevisions: 0,
        missingOriginalContents: 0,
        erroredRevisions: 0,
      };
    }

    if (!dryRun) {
      await Revisions.rawUpdateOne(
        { _id: revisionId },
        { $set: { wordCount: computedWordCount } },
      );
    }

    return {
      updatedRevisions: 1,
      unchangedRevisions: 0,
      missingRevisions: 0,
      missingOriginalContents: 0,
      erroredRevisions: 0,
    };
  } catch (error) {
    console.error(`Failed to recompute wordCount for revision ${revisionId}`, error);
    return {
      updatedRevisions: 0,
      unchangedRevisions: 0,
      missingRevisions: 0,
      missingOriginalContents: 0,
      erroredRevisions: 1,
    };
  }
}

function mergeCounts(total: RecomputeCounts, next: Partial<RecomputeCounts>): RecomputeCounts {
  return {
    scannedPosts: total.scannedPosts + (next.scannedPosts ?? 0),
    updatedRevisions: total.updatedRevisions + (next.updatedRevisions ?? 0),
    unchangedRevisions: total.unchangedRevisions + (next.unchangedRevisions ?? 0),
    missingRevisions: total.missingRevisions + (next.missingRevisions ?? 0),
    missingOriginalContents: total.missingOriginalContents + (next.missingOriginalContents ?? 0),
    erroredRevisions: total.erroredRevisions + (next.erroredRevisions ?? 0),
  };
}

export async function recomputePublicPostWordCounts({
  dryRun = true,
  batchSize = DEFAULT_BATCH_SIZE,
  concurrency = DEFAULT_CONCURRENCY,
  maxPosts,
}: RecomputePublicPostWordCountsOptions = {}): Promise<RecomputeCounts> {
  if (batchSize <= 0) {
    throw new Error(`Invalid batchSize: ${batchSize}`);
  }
  if (concurrency <= 0) {
    throw new Error(`Invalid concurrency: ${concurrency}`);
  }

  console.log(`Starting recomputePublicPostWordCounts with dryRun=${dryRun}, batchSize=${batchSize}, concurrency=${concurrency}, maxPosts=${maxPosts ?? "none"}`);

  const context = createAnonymousContext();
  let counts: RecomputeCounts = {
    scannedPosts: 0,
    updatedRevisions: 0,
    unchangedRevisions: 0,
    missingRevisions: 0,
    missingOriginalContents: 0,
    erroredRevisions: 0,
  };

  let lastSeenPostId = "";
  let batchesProcessed = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await getPublicPostLatestRevisionBatch(lastSeenPostId, batchSize);
    if (rows.length === 0) {
      break;
    }

    const rowsToProcess = typeof maxPosts === "number"
      ? rows.slice(0, Math.max(0, maxPosts - counts.scannedPosts))
      : rows;

    if (rowsToProcess.length === 0) {
      break;
    }

    counts = mergeCounts(counts, { scannedPosts: rowsToProcess.length });
    const queueResults = await executePromiseQueue(
      rowsToProcess.map((row) => async () => {
        return await recomputeSingleRevisionWordCount({
          revisionId: row.revisionId,
          context,
          dryRun,
        });
      }),
      concurrency,
    );

    for (const result of queueResults) {
      counts = mergeCounts(counts, result);
    }

    batchesProcessed += 1;
    lastSeenPostId = rows[rows.length - 1].postId;
    console.log(
      `[batch ${batchesProcessed}] scanned=${counts.scannedPosts} updated=${counts.updatedRevisions} unchanged=${counts.unchangedRevisions} missingRev=${counts.missingRevisions} missingOriginal=${counts.missingOriginalContents} errors=${counts.erroredRevisions}`
    );

    if (typeof maxPosts === "number" && counts.scannedPosts >= maxPosts) {
      break;
    }
  }

  console.log("Finished recomputePublicPostWordCounts");
  console.log(JSON.stringify(counts, null, 2));
  return counts;
}
