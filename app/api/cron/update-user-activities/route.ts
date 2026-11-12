import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { updateUserActivities } from '@/server/useractivities/cron';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  const context = createAnonymousContext({ forumType: getForumTypeForRequest(request) });

  if (context.forumType !== 'LessWrong') {
    return new Response('OK', { status: 200 });
  }

  await updateUserActivities({randomWait: true});
  
  return new Response('OK', { status: 200 });
}
