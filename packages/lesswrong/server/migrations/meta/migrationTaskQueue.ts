const queuedMigrationTasks: Array<() => Promise<any>> = [];

/**
 * Don't use this except for things that are going to be run during migrations,
 * it isn't using Vercel's `after`/`waitUntil` and won't execute _at all_ during
 * runtime in deployed code.
 */
export const queueMigrationTask = <T>(fn: () => Promise<T>) => {
  queuedMigrationTasks.push(fn);
};

export async function runQueuedMigrationTasksSequentially() {
  while (queuedMigrationTasks.length > 0) {
    const fn = queuedMigrationTasks.shift();
    try {
      await fn!();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Uncaught error in queued background task', err);
    }
  }
}
