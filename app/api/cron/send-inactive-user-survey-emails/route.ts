import type { NextRequest } from 'next/server';
import { sendInactiveUserSurveyEmails } from '@/server/inactiveUserSurveyCron';
import { isEAForum } from '@/lib/instanceSettings';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!isEAForum) {
    return new Response('OK', { status: 200 });
  }

  await sendInactiveUserSurveyEmails();
  
  return new Response('OK', { status: 200 });
}
