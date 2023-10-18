import { isAnyTest, isDevelopment, onStartup } from '../lib/executionEnvironment';
import { SyncedCron } from './vendor/synced-cron/synced-cron-server';
import { getCommandLineArguments } from './commandLine';

SyncedCron.options = {
  log: !isDevelopment,
  collectionName: 'cronHistory',
  utc: false,
  collectionTTL: 172800
};

export function addCronJob(options: {
  name: string,
  interval?: string,
  // uses later.js parser, no seconds allowed though
  cronStyleSchedule?: string,
  job: ()=>void,
})
{
  onStartup(function() {
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
  });
}

export function removeCronJob(name: string) {
  SyncedCron.rawRemove(name);
}

export function startSyncedCron() {
  if (typeof SyncedCron !== 'undefined') {
    SyncedCron.start();
  }
}

onStartup(function() {
  startSyncedCron();
});
