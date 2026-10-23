import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { sendCurationEmails } from '@/server/curationEmails/cron';
import { testServerSetting } from '@/lib/instanceSettings';
import { usesCurationEmailsCron } from '@/lib/betas';
import { dispatchPendingEvents } from '@/server/debouncer';
import { checkAndSendUpcomingEventEmails } from '@/server/eventReminders';
import { updateScoreActiveDocuments } from '@/server/votingCron';
import { getLockOrAbort } from '@/server/utils/advisoryLockUtil';
import { retryStalledLlmRuns } from '@/server/languageModels/llmRuns';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  const context = createAnonymousContext({ forumType: getForumTypeForRequest(request) });

  const isTestServer = testServerSetting.get(context);

  // Run all once-a-minute tasks
  const tasks: Promise<void>[] = [];

  // Send curation emails
  if (!isTestServer && usesCurationEmailsCron(context.forumType)) {
    tasks.push(getLockOrAbort('sendCurationEmails', sendCurationEmails));
  }

  // Debounced event handler
  if (!isTestServer) {
    tasks.push(getLockOrAbort('dispatchPendingEvents', dispatchPendingEvents));
  }

  // Check upcoming event emails
  if (!isTestServer) {
    await getLockOrAbort('checkAndSendUpcomingEventEmails', checkAndSendUpcomingEventEmails.bind(null, context.forumType));
  }

  if (!isTestServer) {
    tasks.push(getLockOrAbort('retryStalledLlmRuns', retryStalledLlmRuns.bind(null, context.forumType)));
  }

  // Update score active documents (runs regardless of test server setting)
  await getLockOrAbort('updateScoreActiveDocuments', updateScoreActiveDocuments);

  // Execute all tasks in parallel
  await Promise.all(tasks);
  
  return new Response('OK', { status: 200 });
}
