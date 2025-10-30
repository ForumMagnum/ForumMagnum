import type { NextRequest } from 'next/server';
import { updatePromotedSpotlightItem } from '@/server/spotlightCron';
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.cronjob;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await updatePromotedSpotlightItem();
  
  return new Response('OK', { status: 200 });
}
