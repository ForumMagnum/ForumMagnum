import type { NextRequest } from 'next/server';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { captureException } from '@/lib/sentryWrapper';
import { postMessage } from '@/server/slack/client';
import { getSupermodStatus } from '../supermod-status-to-slack/getSupermodStatus';
import { formatWeeklySupermodBlocks, formatWeeklySupermodMessage, getTwoMonthWindow, getWeeklyWindow } from '../supermod-status-to-slack/supermodStatusFormat';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const context = createAnonymousContext();
    const { windowStart, windowEnd } = getWeeklyWindow(new Date());
    const twoMonths = getTwoMonthWindow(windowEnd);
    const [report, lastTwoMonths] = await Promise.all([
      getSupermodStatus(context, windowStart, windowEnd),
      getSupermodStatus(context, twoMonths.windowStart, twoMonths.windowEnd),
    ]);
    const text = formatWeeklySupermodMessage(report, lastTwoMonths);
    await postMessage({
      text,
      channelName: 'moderation',
      options: {
        mrkdwn: true,
        unfurl_links: false,
        unfurl_media: false,
        blocks: formatWeeklySupermodBlocks(report, lastTwoMonths),
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Posted supermod weekly status to Slack`);
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Failed to post supermod weekly status to Slack:', error);
    return new Response('Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
