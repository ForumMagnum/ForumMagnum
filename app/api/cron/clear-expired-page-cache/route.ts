import type { NextRequest } from 'next/server';
import PageCacheRepo from '@/server/repos/PageCacheRepo';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const pageCacheRepo = new PageCacheRepo();
  await pageCacheRepo.clearExpiredEntries();
  
  return new Response('OK', { status: 200 });
}
