import type { NextRequest } from 'next/server';
import { sendCurationEmails } from '@/server/curationEmails/cron';
import { testServerSetting } from '@/lib/instanceSettings';
import { useCurationEmailsCron } from '@/lib/betas';
import { dispatchPendingEvents } from '@/server/debouncer';
import { checkAndSendUpcomingEventEmails } from '@/server/eventReminders';
import { updateScoreActiveDocuments } from '@/server/votingCron';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const isTestServer = testServerSetting.get();

  // Run all once-a-minute tasks
  const tasks: Promise<void>[] = [];

  // Send curation emails
  if (!isTestServer && useCurationEmailsCron) {
    tasks.push(sendCurationEmails());
  }

  // Debounced event handler
  if (!isTestServer) {
    tasks.push(dispatchPendingEvents());
  }

  // Check upcoming event emails
  if (!isTestServer) {
    tasks.push(checkAndSendUpcomingEventEmails());
  }

  // Update score active documents (runs regardless of test server setting)
  tasks.push(updateScoreActiveDocuments());

  // Execute all tasks in parallel
  await Promise.all(tasks);
  
  return new Response('OK', { status: 200 });
}
