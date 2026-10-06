import { captureException } from "@/lib/sentryWrapper";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import type { ForumTypeString } from "@/lib/instanceSettings";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { createAutomatedContentEvaluation } from "./helpers";

// Must match the schedule of /api/cron/retry-missing-pangram-evaluations in vercel.json.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

// Minutes after publication at which a missing evaluation is retried, once each.
// Spacing retries out bounds the cost of content that always fails, while still
// recovering from longer Pangram outages. The first retry leaves time for the
// evaluation started at publish time to finish.
const RETRY_AFTER_MINUTES = [5, 30, 2 * 60, 8 * 60, 24 * 60];

const MAX_CANDIDATES = 200;
const MAX_EVALUATIONS_PER_RUN = 20;
const MAX_CONCURRENT_EVALUATIONS = 10;

function isDueForRetry(publishedAt: Date, now: Date): boolean {
  const age = now.getTime() - publishedAt.getTime();
  return RETRY_AFTER_MINUTES.some((minutes) => {
    const retryAge = minutes * 60 * 1000;
    return age >= retryAge && age < retryAge + SWEEP_INTERVAL_MS;
  });
}

async function evaluateRevision(revision: DbRevision, context: ResolverContext): Promise<boolean> {
  try {
    return !!await createAutomatedContentEvaluation(revision, context, { autoreject: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Retrying the automated content evaluation of revision ${revision._id} failed:`, e);
    captureException(e);
    return false;
  }
}

/**
 * Re-run the automated content evaluation (and autoreject) for content awaiting
 * moderator review whose evaluation failed at publish time.
 */
export async function retryMissingPangramEvaluations(forumType: ForumTypeString): Promise<void> {
  if (forumType !== "LessWrong") return;

  const context = createAnonymousContext({ forumType });
  const now = new Date();
  const candidates = await context.repos.automatedContentEvaluations.getUnevaluatedRevisionsAwaitingReview(
    new Date(now.getTime() - (Math.max(...RETRY_AFTER_MINUTES) * 60 * 1000 + SWEEP_INTERVAL_MS)),
    new Date(now.getTime() - Math.min(...RETRY_AFTER_MINUTES) * 60 * 1000),
    MAX_CANDIDATES,
  );
  const dueRevisionIds = candidates
    .filter((candidate) => isDueForRetry(candidate.publishedAt, now))
    .slice(0, MAX_EVALUATIONS_PER_RUN)
    .map((candidate) => candidate.revisionId);
  if (!dueRevisionIds.length) return;

  const revisions = await context.Revisions.find({ _id: { $in: dueRevisionIds } }).fetch();
  const results = await executePromiseQueue(
    revisions.map((revision) => () => evaluateRevision(revision, context)),
    MAX_CONCURRENT_EVALUATIONS,
  );
  // eslint-disable-next-line no-console
  console.log(`Retried ${revisions.length} missing automated content evaluations; ${results.filter(Boolean).length} succeeded`);
}
