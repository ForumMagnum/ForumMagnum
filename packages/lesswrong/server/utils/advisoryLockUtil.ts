import { captureException } from "@/lib/sentryWrapper";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { cyrb53Rand } from '@/server/perfMetrics';

/**
 * WARNING: this is not safe to use in most regular production code,
 * because it causes connection pinning in RDS proxy (which in turn
 * can cause function instances to become totally connection starved).
 */
export function getSessionLockOrAbort(lockName: string, callback: () => Promise<void>) {
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
      return await callback();
    } finally {
      await task.any(`SELECT pg_advisory_unlock($1)`, [lockId]);
    }
  });
}
