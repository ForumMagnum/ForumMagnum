import { isAnyTest } from '../lib/executionEnvironment';
import { SyncedCron } from './vendor/synced-cron/synced-cron-server';
import { getCommandLineArguments } from './commandLine';
import { CronHistories } from '../lib/collections/cronHistories/collection';
import { Globals } from '@/lib/vulcan-lib/config';

export type CronJobSpec = {
  name: string,
  interval?: string,
  // uses later.js parser, no seconds allowed though
  cronStyleSchedule?: string,
  job: () => void,
}

export function addCronJob(options: CronJobSpec) {
  if (!isAnyTest && !getCommandLineArguments().shellMode) {
    // Defer starting of cronjobs until 20s after server startup
    setTimeout(() => {
      SyncedCron.add({
        name: options.name,
        schedule: (parser: any) => {
          if (options.interval)
            return parser.text(options.interval);
          else if (options.cronStyleSchedule) {
            const hasSeconds = options.cronStyleSchedule.split(' ').length > 5;
            return parser.cron(options.cronStyleSchedule, hasSeconds);
          }
          else
            throw new Error("addCronJob needs a schedule specified");
        },
        job: options.job,
      });
    }, 20000);
  }
}

export function removeCronJob(name: string) {
  SyncedCron.rawRemove(name);
}

export function startSyncedCron() {
  SyncedCron.start();
}

async function clearOldCronHistories() {
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  await CronHistories.rawRemove({
    startedAt: {
      $lt: new Date(new Date().getTime() - ONE_WEEK),
    },
  });
}
Globals.clearOldCronHistories = clearOldCronHistories

addCronJob({
  name: "clearOldCronHistories",
  interval: 'every 24 hours',
  job: async () => {
    await clearOldCronHistories();
  }
});
