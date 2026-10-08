import type { NextRequest } from 'next/server';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { getForumTypeForRequest } from '@/server/utils/requestUtil';
import { captureException } from '@/lib/sentryWrapper';
import { postMessage } from '@/server/slack/client';
import { getSupermodStatus } from './getSupermodStatus';
import {
  formatDailySupermodMessage,
  formatWeeklySupermodBlocks,
  formatWeeklySupermodMessage,
  getMostRecentPacificReportTime,
  isSupermodReportTime,
  type SlackMessageBlock,
} from './supermodStatusFormat';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  if (!isSupermodReportTime(now)) {
    return new Response('Outside report time', { status: 200 });
  }

  try {
    const context = createAnonymousContext({ forumType: getForumTypeForRequest(request) });
    const { daily, weekly } = await getSupermodStatus(context, getMostRecentPacificReportTime(now));
    const messages: Array<{ text: string; blocks?: SlackMessageBlock[] }> = [
      { text: formatDailySupermodMessage(daily) },
    ];
    if (weekly) {
      messages.push({
        text: formatWeeklySupermodMessage(weekly.report, weekly.lastTwoMonths),
        blocks: formatWeeklySupermodBlocks(weekly.report, weekly.lastTwoMonths),
      });
    }
    // Let both sends finish even if one fails, before ending the serverless request.
    const results = await Promise.allSettled(messages.map(message => postMessage({
      text: message.text,
      channelName: 'moderation',
      options: { mrkdwn: true, unfurl_links: false, unfurl_media: false, blocks: message.blocks },
    })));
    const errors = results.flatMap(result => result.status === 'rejected' ? [result.reason] : []);
    if (errors.length) throw new AggregateError(errors, 'Failed to post supermod status to Slack');
    // eslint-disable-next-line no-console
    console.log(`Posted supermod ${weekly ? 'daily and weekly' : 'daily'} status to Slack`);
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Failed to post supermod status to Slack:', error);
    return new Response('Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
