import type { NextRequest } from 'next/server';
import PostRecommendationsRepo from '@/server/repos/PostRecommendationsRepo';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const repo = new PostRecommendationsRepo();
  await repo.clearStaleRecommendations();
  
  return new Response('OK', { status: 200 });
}
