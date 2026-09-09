import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import type { NextRequest } from 'next/server';
import { checkScheduledPosts } from '@/server/posts/cron';
import { runRSSImport } from '@/server/rss-integration/cron';
import { getLockOrAbort } from '@/server/utils/advisoryLockUtil';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run all every-ten-minutes tasks in parallel
  await Promise.all([
    // Check scheduled posts
    checkScheduledPosts(),
    
    // Add new RSS posts
    await getLockOrAbort('runRSSImport', runRSSImport.bind(null, getForumTypeForRequest(request)))
  ]);

  return new Response('OK', { status: 200 });
}
