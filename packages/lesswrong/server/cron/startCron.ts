import { isAnyTest } from '@/lib/executionEnvironment';
import { SyncedCron } from '@/server/vendor/synced-cron/synced-cron-server';
import { getCommandLineArguments } from '@/server/commandLine';
import { sleep } from '@/lib/utils/asyncUtils';
import { allCronJobs } from './allCronJobs';
import { cronJobsDefined } from './cronUtil';

export function startSyncedCron() {
  if (isAnyTest || getCommandLineArguments().shellMode) {
    return;
  }

  // Defer starting of cronjobs until 20s after server startup
  void (async () => {
    await sleep(20000);
  
    // Check that cronJobsDefined and allCronJobs match
    for (const definedCronJob of cronJobsDefined) {
      if (!allCronJobs.includes(definedCronJob)) {
        // eslint-disable-next-line no-console
        console.error(`Cronjob ${definedCronJob.name} is not in allCronJobs`);
      }
    }
  
    // Add each cronjob in allCronJobs to synced-cron
    for (const cronjob of allCronJobs) {
      if (!cronjob || cronjob.disabled) {
        continue;
      }
      SyncedCron.add({
        name: cronjob.name,
        schedule: (parser: any) => {
          if (cronjob.interval) {
            return parser.text(cronjob.interval);
          } else if (cronjob.cronStyleSchedule) {
            const hasSeconds = cronjob.cronStyleSchedule.split(' ').length > 5;
            return parser.cron(cronjob.cronStyleSchedule, hasSeconds);
          } else {
            throw new Error("addCronJob needs a schedule specified");
          }
        },
        job: cronjob.job,
      });
    }
    SyncedCron.start();
  })();
}
