import { isAnyTest, onStartup, runAfterDelay } from '../lib/executionEnvironment';
import { SyncedCron } from './vendor/synced-cron/synced-cron-server';

SyncedCron.options = {
  log: true,
  collectionName: 'cronHistory',
  utc: false,
  collectionTTL: 172800
};

export function addCronJob(options: {
  name: string,
  interval?: string,
  cronStyleSchedule?: string,
  job: ()=>void,
})
{
  onStartup(function() {
    if (!isAnyTest) {
      // Defer starting of cronjobs until 20s after server startup
      runAfterDelay(() => {
        SyncedCron.add({
          name: options.name,
          schedule: (parser: any) => {
            if (options.interval)
              return parser.text(options.interval);
            else if (options.cronStyleSchedule)
              return parser.cron(options.cronStyleSchedule);
            else
              throw new Error("addCronJob needs a schedule specified");
          },
          job: options.job,
        });
      }, 20000);
    }
  });
}

export function startSyncedCron() {
  if (typeof SyncedCron !== 'undefined') {
    SyncedCron.start();
  }
}
