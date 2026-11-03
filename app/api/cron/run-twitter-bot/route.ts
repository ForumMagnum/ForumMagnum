import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { runTwitterBot } from '@/server/twitterBot';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  await runTwitterBot(getForumTypeForRequest(request));
  
  return new Response('OK', { status: 200 });
}
