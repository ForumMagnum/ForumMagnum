import type { NextRequest } from 'next/server';
import PageCacheRepo from '@/server/repos/PageCacheRepo';
import { userLoginTokensView } from "@/server/postgresView";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run all every-five-minutes tasks in parallel
  const tasks: Promise<void>[] = [];

  // Clear expired page cache
  const pageCacheRepo = new PageCacheRepo();
  tasks.push(pageCacheRepo.clearExpiredEntries());

  // Update user login tokens view
  const userLoginTokensJob = userLoginTokensView.getCronJob()?.job;
  if (userLoginTokensJob) {
    tasks.push(userLoginTokensJob());
  }

  // Execute all tasks in parallel
  await Promise.all(tasks);
  
  return new Response('OK', { status: 200 });
}
