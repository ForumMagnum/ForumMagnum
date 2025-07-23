import type { NextRequest } from 'next/server';
import { updateScoreActiveDocuments } from '@/server/votingCron';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await updateScoreActiveDocuments();
  
  return new Response('OK', { status: 200 });
}
