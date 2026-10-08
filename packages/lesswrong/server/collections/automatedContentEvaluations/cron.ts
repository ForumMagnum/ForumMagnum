import { captureException } from '@/lib/sentryWrapper';
import type { ForumTypeString } from '@/lib/instanceSettings';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { createAutomatedContentEvaluation } from './helpers';

// The delay lets the publish-time check finish; the cutoff caps retries of content that always fails.
const RETRY_FROM_MS = 5 * 60 * 1000;
const RETRY_UNTIL_MS = 2 * 60 * 60 * 1000;
const MAX_RETRIES_PER_RUN = 20;

export async function retryMissingPangramEvaluations(forumType: ForumTypeString): Promise<void> {
  // Matches the publish-time check.
  if (forumType !== 'LessWrong') return;

  const context = createAnonymousContext({ forumType });
  const now = Date.now();
  const revisions = await context.repos.automatedContentEvaluations.getUnevaluatedRevisionsAwaitingReview(
    new Date(now - RETRY_UNTIL_MS),
    new Date(now - RETRY_FROM_MS),
    MAX_RETRIES_PER_RUN,
  );
  const results = await Promise.allSettled(revisions.map((revision) =>
    createAutomatedContentEvaluation(revision, context, { autoreject: true })
  ));
  for (const result of results) {
    if (result.status === 'rejected') captureException(result.reason);
  }
}
