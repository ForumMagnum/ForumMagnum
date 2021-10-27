import { isAnyTest, onStartup } from '../lib/executionEnvironment';
import { SyncedCron } from './vendor/synced-cron/synced-cron-server';
import { getCommandLineArguments } from './commandLine';

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
    if (!isAnyTest && !getCommandLineArguments().shellMode) {
      // Defer starting of cronjobs until 20s after server startup
      setTimeout(() => {
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

export function removeCronJob(name: string) {
  SyncedCron.remove(name);
}

export function startSyncedCron() {
  if (typeof SyncedCron !== 'undefined') {
    SyncedCron.start();
  }
}

onStartup(function() {
  startSyncedCron();
});
