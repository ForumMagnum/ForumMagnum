import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { clearArbitalCache } from '@/server/resolvers/arbitalPageData';
import { permanentlyDeleteUsers } from '@/server/users/permanentDeletion';
import { uniquePostUpvotersView } from "@/server/postgresView";
import { clearLoggedOutServedSessionsWithNoViews, clearOldUltraFeedServedEvents } from '@/server/ultraFeed/cron';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { sendScheduledAiDigestEmails } from '@/server/aiDigest/aiDigestScheduledEmails';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  // Run some hourly tasks in parallel
  const tasks: Promise<void>[] = [];

  // Clear Arbital cache
  tasks.push(clearArbitalCache());

  // Permanently delete users
  tasks.push(permanentlyDeleteUsers(getForumTypeForRequest(request)));

  await Promise.all(tasks);

  // These are heavier and we don't want to stress the db too much, so run these sequentially

  // Update unique post upvoters view
  const db = getSqlClientOrThrow();
  await uniquePostUpvotersView.refresh(db);

  // Clear ultrafeed served events older than 48 hours
  await clearOldUltraFeedServedEvents();

  // Clear logged-out ultrafeed served sessions with no views
  await clearLoggedOutServedSessionsWithNoViews();

  // Send scheduled "Content for You" digests to subscribers who are due one
  await sendScheduledAiDigestEmails();

  return new Response('OK', { status: 200 });
}
