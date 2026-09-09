import type { NextRequest } from 'next/server';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { captureException } from '@/lib/sentryWrapper';
import { postMessage } from '@/server/slack/client';
import { getSupermodStatus } from './getSupermodStatus';
import { formatDailySupermodMessage, getDailyWindow } from './supermodStatusFormat';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const context = createAnonymousContext();
    const { windowStart, windowEnd } = getDailyWindow(new Date());
    const report = await getSupermodStatus(context, windowStart, windowEnd);
    const text = formatDailySupermodMessage(report);
    await postMessage({
      text,
      channelName: 'moderation',
      options: { mrkdwn: true, unfurl_links: false, unfurl_media: false },
    });
    // eslint-disable-next-line no-console
    console.log(`Posted supermod daily status to Slack`);
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Failed to post supermod daily status to Slack:', error);
    return new Response('Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
