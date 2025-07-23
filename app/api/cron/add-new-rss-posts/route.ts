import type { NextRequest } from 'next/server';
import { runRSSImport } from '@/server/rss-integration/cron';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await runRSSImport();
  
  return new Response('OK', { status: 200 });
}
