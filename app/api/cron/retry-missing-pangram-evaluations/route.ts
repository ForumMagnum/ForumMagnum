import type { NextRequest } from 'next/server';
import { getForumTypeForRequest } from '@/server/utils/requestUtil';
import { getLockOrAbort } from '@/server/utils/advisoryLockUtil';
import { retryMissingPangramEvaluations } from '@/server/collections/automatedContentEvaluations/cron';

// Each Pangram evaluation can take up to 90 seconds, and a run does up to two
// rounds of them.
export const maxDuration = 300;

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
