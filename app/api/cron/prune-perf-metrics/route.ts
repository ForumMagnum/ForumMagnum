import type { NextRequest } from 'next/server';
import { pruneOldPerfMetrics } from '@/server/analytics/serverAnalyticsWriter';
import { performanceMetricLoggingEnabled } from '@/lib/instanceSettings';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (performanceMetricLoggingEnabled.get()) {
    await pruneOldPerfMetrics();
  }
  
  return new Response('OK', { status: 200 });
}
