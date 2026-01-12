import { captureException } from "@/lib/sentryWrapper";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { cyrb53Rand } from '@/server/perfMetrics';
import type { ITask } from "pg-promise";

/**
 * Try to get an advisory lock. If successful, runs `callback` with a task that
 * holds that lock.
 * NOTE: This consumes one connection from the connection pool, until
 * `callback()` is finished. This means that if you take a lot of locks at once,
 * you can't guarantee that the connection pool will have any other connections
 * left, besides the one you got as a callback. So in order to use this safely,
 * you need to guarantee either (1) the number of simultaneous calls to
 * getLockOrAbort is smaller than the connection pool size, or (3) queries
 * performed inside of `callback` use only the connection that was provided
 * as an argument to the callback.
 */
export function getLockOrAbort(lockName: string, callback: (task: ITask<any>) => Promise<void>) {
  const db = getSqlClientOrThrow();
  const lockId = Math.floor(cyrb53Rand(lockName) * 1e15);

  return db.task(async (task) => {
    try {
      const lockResult = await task.any<{ pg_try_advisory_lock: boolean }>(`SELECT pg_try_advisory_lock($1)`, [lockId]);
      if (!lockResult[0].pg_try_advisory_lock) {
        // eslint-disable-next-line no-console
        console.error(`Lock could not be acquired for job ${lockName}`);
        captureException(new Error(`Lock could not be acquired for job ${lockName}`));
        return;
      }
      return await callback(task);
    } finally {
      await task.any(`SELECT pg_advisory_unlock($1)`, [lockId]);
    }
  });
}
