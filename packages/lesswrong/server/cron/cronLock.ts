import { captureException } from "@/lib/sentryWrapper";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { cyrb53Rand } from '@/server/perfMetrics';

export function getCronLock(cronName: string, callback: () => Promise<void>) {
  const db = getSqlClientOrThrow();
  const lockId = Math.floor(cyrb53Rand(cronName) * 1e15);

  return db.task(async (task) => {
    try {
      // Set an 800-second-long lock on whatever cron job is being passed in.
      // We don't have any cron jobs that should take that long to run
      // in the database, but we've had a couple of incidents of downtime
      // where we suspect that the situation was made worse by the cron
      // scheduler firing off additional cron jobs while the database
      // was already under too much load.
      // If we have such an incident again, the worst-case scenario
      // is that the lock gets held for an 800s (around the duration of
      // the maximum Vercel function lifetime).  This should be fine
      // for basically all cron jobs that we might lock like this.
      await task.none(`SET LOCAL lock_timeout = '800s'`);
      const lockResult = await task.any<{ pg_try_advisory_lock: boolean }>(`SELECT pg_try_advisory_lock($1)`, [lockId]);
      if (!lockResult[0].pg_try_advisory_lock) {
        // eslint-disable-next-line no-console
        console.error(`Lock could not be acquired for cron job ${cronName}`);
        captureException(new Error(`Lock could not be acquired for cron job ${cronName}`));
        return;
      }
      return await callback();
    } finally {
      await task.any(`SELECT pg_advisory_unlock($1)`, [lockId]);
    }
  });
}
