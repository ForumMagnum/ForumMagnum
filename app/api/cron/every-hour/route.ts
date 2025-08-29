import type { NextRequest } from 'next/server';
import { clearArbitalCache } from '@/server/resolvers/arbitalPageData';
import { permanentlyDeleteUsers } from '@/server/users/permanentDeletion';
import { uniquePostUpvotersView } from "@/server/postgresView";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run all hourly tasks in parallel
  const tasks: Promise<void>[] = [];

  // Clear Arbital cache
  tasks.push(clearArbitalCache());

  // Permanently delete users
  tasks.push(permanentlyDeleteUsers());

  // Update unique post upvoters view
  const uniquePostUpvotersJob = uniquePostUpvotersView.getCronJob()?.job;
  if (uniquePostUpvotersJob) {
    tasks.push(uniquePostUpvotersJob());
  }

  // Execute all tasks in parallel
  await Promise.all(tasks);
  
  return new Response('OK', { status: 200 });
}
