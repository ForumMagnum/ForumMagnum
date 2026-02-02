import type { NextRequest } from 'next/server';
import { WebClient } from '@slack/web-api';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { captureException } from '@/lib/sentryWrapper';

interface CurationStatus {
  daysSinceCurated: number;
  lastCurationDate: Date | null;
  unpublishedDraftCount: number;
  averageDaysPerCuration: number | null;
}

async function getCurationStatus(): Promise<CurationStatus> {
  const context = createAnonymousContext();
  // Days since most recent curation
  const mostRecentCuration = await context.Posts.findOne(
    { curatedDate: { $gt: new Date(0) } },
    { sort: { curatedDate: -1 } }
  );

  if (!mostRecentCuration || !mostRecentCuration.curatedDate) {
    return {
      daysSinceCurated: 0,
      lastCurationDate: null,
      unpublishedDraftCount: 0,
      averageDaysPerCuration: null,
    };
  }
  
  // Get curations from the last month to calculate average
  const oneMonthAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
  const recentCuratedPosts = await context.Posts.find(
    { curatedDate: { $gt: oneMonthAgo } },
    { sort: { curatedDate: -1 } }
  ).fetch();
  
  // Calculate average days between curations over the last month
  let averageDaysPerCuration: number | null = null;
  if (recentCuratedPosts.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < recentCuratedPosts.length - 1; i++) {
      const current = new Date(recentCuratedPosts[i].curatedDate!);
      const previous = new Date(recentCuratedPosts[i + 1].curatedDate!);
      const gap = (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000);
      gaps.push(gap);
    }
    averageDaysPerCuration = Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10;
  }
 
  const lastCurationDate = new Date(mostRecentCuration.curatedDate)
  const daysSinceCurated = Math.floor((Date.now() - lastCurationDate.getTime()) / (24 * 60 * 60 * 1000))
  
  // Match the CurationPage logic exactly:
  // Get 20 most recent non-deleted curation notices, filter for drafts for uncurated posts
  const recentCurationNotices = await context.CurationNotices.find(
    { deleted: false },
    { sort: { createdAt: -1 }, limit: 20 }
  ).fetch();
  
  // Collect post IDs from draft notices (those without a commentId)
  const draftNoticePostIds = recentCurationNotices
    .filter(notice => notice.commentId === null && notice.postId)
    .map(notice => notice.postId!);

  // Batch load all posts in one query instead of N+1 queries
  const posts = draftNoticePostIds.length > 0
    ? await context.Posts.find(
        { _id: { $in: draftNoticePostIds } },
        { projection: { _id: 1, curatedDate: 1 } }
      ).fetch()
    : [];

  // Count posts that haven't been curated yet
  const curatedPostIds = new Set(
    posts.filter(post => post.curatedDate).map(post => post._id)
  );
  const unpublishedDraftCount = draftNoticePostIds.filter(
    postId => !curatedPostIds.has(postId)
  ).length;
  
  return {
    daysSinceCurated,
    lastCurationDate,
    unpublishedDraftCount,
    averageDaysPerCuration,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    timeZone: 'America/Los_Angeles'
  });
}

function numberToWord(n: number): string {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  return n <= 10 ? words[n] : n.toString();
}

async function postCurationStatusToSlack(status: CurationStatus) {
  const { daysSinceCurated, lastCurationDate, unpublishedDraftCount, averageDaysPerCuration } = status;
  
  const slackBotToken = process.env.AMANUENSIS_SLACK_BOT_TOKEN;
  const channelId = process.env.CURATION_SLACK_CHANNEL_ID;
  
  if (!channelId) {
    // eslint-disable-next-line no-console
    console.error('CURATION_SLACK_CHANNEL_ID is not set');
    return;
  }
  if (!slackBotToken) {
    // eslint-disable-next-line no-console
    console.error('AMANUENSIS_SLACK_BOT_TOKEN is not set');
    return;
  }
  
  // Build the message
  const lines: string[] = [
    `:newspaper: *Curation Report* :rolled_up_newspaper:`,
    ``,
    `*Average days per curation (last 30 days):* ${averageDaysPerCuration ?? 'N/A'}`,
    `*Days since last curation:* ${daysSinceCurated}${lastCurationDate ? ` (${formatDate(lastCurationDate)})` : ''}`,
    `*Curation drafts ready to go:* ${unpublishedDraftCount}`,
  ];
  
  // Add alerts
  if (unpublishedDraftCount === 0) {
    lines.push('');
    lines.push('🚨 *We need a new curation draft!*');
  }
  
  if (daysSinceCurated >= 3) {
    lines.push('');
    lines.push(':shipit: *We need to curate TODAY!*');
    lines.push('');
    lines.push('Message from Habryka:');
    
    if (daysSinceCurated === 3) {
      // Due today, not late yet
      lines.push(`>Let's curate today!`);
    } else {
      // Day 4+ = late
      const daysLate = daysSinceCurated - 3;
      lines.push(`>Curation curation curation`);
      lines.push(`>Poeple`);
      lines.push(`>${numberToWord(daysLate)} day${daysLate === 1 ? '' : 's'} late`);
      lines.push(`>Why`);
    }
  }
  
  const slack = new WebClient(slackBotToken);
  
  try {
    await slack.chat.postMessage({
      channel: channelId,
      text: lines.join('\n'),
      mrkdwn: true,
    });
  } catch (error) {
    // Log to Sentry but don't let Slack failures crash the cron job
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Failed to post curation status to Slack:', error);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const status = await getCurationStatus();
  
  await postCurationStatusToSlack(status);
  
  // eslint-disable-next-line no-console
  console.log(`Posted curation status to Slack: ${status.daysSinceCurated} days, ${status.unpublishedDraftCount} drafts`);
  
  return new Response('OK', { status: 200 }); 
}
