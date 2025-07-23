import type { NextRequest } from 'next/server';
import { updateScoreInactiveDocuments } from '@/server/votingCron';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await updateScoreInactiveDocuments();
  
  return new Response('OK', { status: 200 });
}
