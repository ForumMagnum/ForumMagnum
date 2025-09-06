import type { NextRequest } from 'next/server';
import { updateAnalyticsCollections } from '@/server/analytics/analyticsCron';
import { isEAForum } from '@/lib/instanceSettings';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!isEAForum()) {
    return new Response('OK', { status: 200 });
  }

  await updateAnalyticsCollections({});
  
  return new Response('OK', { status: 200 });
}
