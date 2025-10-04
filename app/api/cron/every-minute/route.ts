import type { NextRequest } from 'next/server';
import { sendCurationEmails } from '@/server/curationEmails/cron';
import { testServerSetting } from '@/lib/instanceSettings';
import { usesCurationEmailsCron } from '@/lib/betas';
import { dispatchPendingEvents } from '@/server/debouncer';
import { checkAndSendUpcomingEventEmails } from '@/server/eventReminders';
import { updateScoreActiveDocuments } from '@/server/votingCron';
import { getCronLock } from '@/server/cron/cronLock';

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
    // This doesn't need an advisory lock because it runs a while loop that pulls emails off a queue one at at time,
    // so we aren't going to get stuck with a very large number of heavy, concurrent queries if this job gets run again
    // while the last batch is still going.
    tasks.push(sendCurationEmails());
  }

  // Debounced event handler
  if (!isTestServer) {
    // This doesn't need an advisory lock because it runs a while loop that updates individual database records as it goes,
    // so we aren't going to get stuck with a very large number of heavy, concurrent queries if this job gets run again
    // while the last batch is still going.
    tasks.push(dispatchPendingEvents());
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
