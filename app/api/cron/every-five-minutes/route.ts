import type { NextRequest } from 'next/server';
import PageCacheRepo from '@/server/repos/PageCacheRepo';
import { userLoginTokensView } from "@/server/postgresView";
import { getCronLock } from '@/server/cron/cronLock';
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.cronjob;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Clear expired page cache
  const pageCacheRepo = new PageCacheRepo();
  await pageCacheRepo.clearExpiredEntries();

  // Update user login tokens view
  const userLoginTokensJob = userLoginTokensView.getCronJob()?.job;
  if (userLoginTokensJob) {
    await getCronLock('userLoginTokensJob', userLoginTokensJob);
  }
  
  return new Response('OK', { status: 200 });
}
