import type { NextRequest } from 'next/server';
import { WebClient } from '@slack/web-api';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';

interface CurationStatus {
  daysSinceCurated: number;
  lastCurationDate: Date | null;
  unpublishedDraftCount: number;
  averageDaysPerCuration: number | null;
}

async function getCurationStatus(): Promise<CurationStatus> {
  const context = createAnonymousContext();
  
  // Get curations from the last month to calculate average
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
  
  // Days since most recent curation
  const mostRecentCuration = await context.Posts.findOne(
    { curatedDate: { $gt: new Date(0) } },
    { sort: { curatedDate: -1 } }
  );
  const lastCurationDate = mostRecentCuration?.curatedDate 
    ? new Date(mostRecentCuration.curatedDate) 
    : null;
  const daysSinceCurated = lastCurationDate
    ? Math.floor((Date.now() - lastCurationDate.getTime()) / (24 * 60 * 60 * 1000))
    : Infinity;
  
  // Match the CurationPage logic exactly:
  // Get 20 most recent non-deleted curation notices, filter for drafts for uncurated posts
  const recentCurationNotices = await context.CurationNotices.find(
    { deleted: false },
    { sort: { createdAt: -1 }, limit: 20 }
  ).fetch();
  
  let unpublishedDraftCount = 0;
  for (const notice of recentCurationNotices) {
    if (notice.commentId === null && notice.postId) {
      const post = await context.Posts.findOne({ _id: notice.postId });
      if (post && !post.curatedDate) {
        unpublishedDraftCount++;
      }
    }
  }
  
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
  
  await slack.chat.postMessage({
    channel: channelId,
    text: lines.join('\n'),
    mrkdwn: true,
  });
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
  
  return new Response(
    `Days since last curation: ${status.daysSinceCurated}\n` +
    `Unpublished drafts: ${status.unpublishedDraftCount}\n` +
    `Average days per curation: ${status.averageDaysPerCuration}`,
    { status: 200 }
  );
}
