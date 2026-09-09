import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import type { NextRequest } from 'next/server';
import { updateUserActivities } from '@/server/useractivities/cron';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const context = createAnonymousContext();

  if (context.forumType !== 'LessWrong') {
    return new Response('OK', { status: 200 });
  }

  await updateUserActivities({randomWait: true});
  
  return new Response('OK', { status: 200 });
}
