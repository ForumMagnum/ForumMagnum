import { SyncedCron } from '@/server/vendor/synced-cron/synced-cron-server';
import { CronHistories } from '@/server/collections/cronHistories/collection';

export type CronJobSpec = {
  name: string,
  interval?: string,
  disabled?: boolean,
  // uses later.js parser, no seconds allowed though
  cronStyleSchedule?: string,
  job: () => void,
}

export const cronJobsDefined: CronJobSpec[] = [];

export function addCronJob(options: CronJobSpec): CronJobSpec {
  cronJobsDefined.push(options);
  return options;
}

export function removeCronJob(name: string) {
  SyncedCron.rawRemove(name);
}

export async function clearOldCronHistories() {
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  await CronHistories.rawRemove({
    startedAt: {
      $lt: new Date(new Date().getTime() - ONE_WEEK),
    },
  });
}

export const cronClearOldCronHistories = addCronJob({
  name: "clearOldCronHistories",
  interval: 'every 24 hours',
  job: async () => {
    await clearOldCronHistories();
  }
});
