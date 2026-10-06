import type { NextRequest } from 'next/server';
import { captureException } from '@/lib/sentryWrapper';
import type { ForumTypeString } from '@/lib/instanceSettings';
import { getForumTypeForRequest } from '@/server/utils/requestUtil';
import { getLockOrAbort } from '@/server/utils/advisoryLockUtil';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { createAutomatedContentEvaluation } from '@/server/collections/automatedContentEvaluations/helpers';

// The checks run in parallel, and each can take up to 90 seconds.
export const maxDuration = 120;

// Retry on every run from 5 minutes after publication (leaving time for the
// publish-time check to finish) until 2 hours after, which bounds the cost of
// content that always fails.
const RETRY_FROM_MS = 5 * 60 * 1000;
const RETRY_UNTIL_MS = 2 * 60 * 60 * 1000;
const MAX_RETRIES_PER_RUN = 20;

async function retryMissingPangramEvaluations(forumType: ForumTypeString): Promise<void> {
  // Like the publish-time check, this only runs on LessWrong.
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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // The lock keeps overlapping runs from evaluating, and autorejecting, the same content twice.
  await getLockOrAbort(
    'retryMissingPangramEvaluations',
    retryMissingPangramEvaluations.bind(null, getForumTypeForRequest(request)),
  );

  return new Response('OK', { status: 200 });
}
