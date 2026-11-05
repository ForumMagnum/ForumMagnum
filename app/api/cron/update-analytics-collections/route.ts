import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { updateAnalyticsCollections } from '@/server/analytics/analyticsCron';
import { isEAForum } from '@/lib/instanceSettings';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  // TODO: Retain the analytics pipeline for a possible LW/AF author-analytics port.
  if (!isEAForum()) {
    return new Response('OK', { status: 200 });
  }

  await updateAnalyticsCollections({});
  
  return new Response('OK', { status: 200 });
}
