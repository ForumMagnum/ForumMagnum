/* eslint-disable no-console */
import {
  AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
  populateAiDigestPostSummaries as populateSummaries,
  type AiDigestSummaryPopulationProgress,
} from "@/server/aiDigest/aiDigestPostSummaries";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

interface PopulateAiDigestPostSummariesOptions {
  summaryModelId?: string;
  limit?: number;
  concurrency?: number;
}

function logProgress(progress: AiDigestSummaryPopulationProgress): void {
  if (
    progress.completedMissingTargetCount % 5 === 0
    || progress.completedMissingTargetCount === progress.missingTargetCount
    || progress.status === "skipped"
  ) {
    console.log(
      `[${progress.completedMissingTargetCount}/${progress.missingTargetCount}] `
      + `${progress.status}: ${progress.postId}`,
    );
  }
}

/**
 * Populate reusable summaries for the global two-week newsletter pool.
 *
 * Smoke-test two targets first:
 * yarn repl dev lw packages/lesswrong/server/scripts/populateAiDigestPostSummaries.ts \
 *   "populateAiDigestPostSummaries({ limit: 2, concurrency: 2 })"
 *
 * Then populate the full pool with bounded concurrency:
 * yarn repl dev lw packages/lesswrong/server/scripts/populateAiDigestPostSummaries.ts \
 *   "populateAiDigestPostSummaries()"
 */
export async function populateAiDigestPostSummaries(
  options: PopulateAiDigestPostSummariesOptions = {},
) {
  const summaryModelId = options.summaryModelId ?? AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID;
  const result = await populateSummaries({
    context: createAnonymousContext(),
    modelId: summaryModelId,
    limit: options.limit,
    concurrency: options.concurrency ?? 4,
    onProgress: logProgress,
  });
  console.log(`Model: ${summaryModelId}`);
  console.log(`Eligible targets: ${result.availableTargetCount}`);
  console.log(`Selected targets: ${result.targetCount}`);
  console.log(`Generated: ${result.generatedSummaryCount}`);
  console.log(`Reused: ${result.reusedSummaryCount}`);
  console.log(`Skipped: ${result.skippedPostCount}`);
  return {
    modelId: summaryModelId,
    availableTargetCount: result.availableTargetCount,
    targetCount: result.targetCount,
    generatedSummaryCount: result.generatedSummaryCount,
    reusedSummaryCount: result.reusedSummaryCount,
    skippedPostCount: result.skippedPostCount,
  };
}
