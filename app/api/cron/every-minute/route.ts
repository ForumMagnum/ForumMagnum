import type { NextRequest } from 'next/server';
import { sendCurationEmails } from '@/server/curationEmails/cron';
import { testServerSetting } from '@/lib/instanceSettings';
import { usesCurationEmailsCron } from '@/lib/betas';
import { dispatchPendingEvents } from '@/server/debouncer';
import { checkAndSendUpcomingEventEmails } from '@/server/eventReminders';
import { updateScoreActiveDocuments } from '@/server/votingCron';
import { getCronLock } from '@/server/cron/cronLock';
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.cronjob;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const isTestServer = testServerSetting.get();

  // Run all once-a-minute tasks
  const tasks: Promise<void>[] = [];

  // Send curation emails
  if (!isTestServer && usesCurationEmailsCron()) {
    tasks.push(getCronLock('sendCurationEmails', sendCurationEmails));
  }

  // Debounced event handler
  if (!isTestServer) {
    tasks.push(getCronLock('dispatchPendingEvents', dispatchPendingEvents));
  }

  // Check upcoming event emails
  if (!isTestServer) {
    await getCronLock('checkAndSendUpcomingEventEmails', checkAndSendUpcomingEventEmails);
  }

  // Update score active documents (runs regardless of test server setting)
  await getCronLock('updateScoreActiveDocuments', updateScoreActiveDocuments);

  // Execute all tasks in parallel
  await Promise.all(tasks);
  
  return new Response('OK', { status: 200 });
}
