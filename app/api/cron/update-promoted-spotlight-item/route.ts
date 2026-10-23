import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { updatePromotedSpotlightItem } from '@/server/spotlightCron';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  await updatePromotedSpotlightItem();
  
  return new Response('OK', { status: 200 });
}
