import type { NextRequest } from 'next/server';
import { dispatchPendingEvents } from '@/server/debouncer';
import { testServerSetting } from '@/lib/instanceSettings';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (testServerSetting.get()) {
    return new Response('OK', { status: 200 });
  }

  await dispatchPendingEvents();
  
  return new Response('OK', { status: 200 });
}
