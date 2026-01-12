import type { NextRequest } from 'next/server';
import { checkScheduledPosts } from '@/server/posts/cron';
import { runRSSImport } from '@/server/rss-integration/cron';
import { getSessionLockOrAbort } from '@/server/utils/advisoryLockUtil';

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
    await getSessionLockOrAbort('runRSSImport', runRSSImport)
  ]);

  return new Response('OK', { status: 200 });
}
