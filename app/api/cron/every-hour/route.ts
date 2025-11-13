import type { NextRequest } from 'next/server';
import { clearArbitalCache } from '@/server/resolvers/arbitalPageData';
import { permanentlyDeleteUsers } from '@/server/users/permanentDeletion';
import { uniquePostUpvotersView } from "@/server/postgresView";
import { clearLoggedOutServedSessionsWithNoViews, clearOldUltraFeedServedEvents } from '@/server/ultraFeed/cron';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run some hourly tasks in parallel
  const tasks: Promise<void>[] = [];

  // Clear Arbital cache
  tasks.push(clearArbitalCache());

  // Permanently delete users
  tasks.push(permanentlyDeleteUsers());

  await Promise.all(tasks);

  // These are heavier and we don't want to stress the db too much, so run these sequentially

  // Update unique post upvoters view
  const uniquePostUpvotersJob = uniquePostUpvotersView.getCronJob()?.job;
  if (uniquePostUpvotersJob) {
    await uniquePostUpvotersJob();
  }

  // Clear ultrafeed served events older than 48 hours
  await clearOldUltraFeedServedEvents();

  // Clear logged-out ultrafeed served sessions with no views
  await clearLoggedOutServedSessionsWithNoViews();
  
  return new Response('OK', { status: 200 });
}
