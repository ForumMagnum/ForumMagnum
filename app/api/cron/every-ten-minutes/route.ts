import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { checkScheduledPosts } from '@/server/posts/cron';
import { runRSSImport } from '@/server/rss-integration/cron';
import { getLockOrAbort } from '@/server/utils/advisoryLockUtil';
import { retryMissingPangramEvaluations } from '@/server/collections/automatedContentEvaluations/cron';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  // Run all every-ten-minutes tasks in parallel
  await Promise.all([
    // Check scheduled posts
    checkScheduledPosts(),

    // Locked to prevent double autorejection if runs overlap
    getLockOrAbort('retryMissingPangramEvaluations', retryMissingPangramEvaluations.bind(null, getForumTypeForRequest(request))),

    // Add new RSS posts
    await getLockOrAbort('runRSSImport', runRSSImport.bind(null, getForumTypeForRequest(request)))
  ]);

  return new Response('OK', { status: 200 });
}
