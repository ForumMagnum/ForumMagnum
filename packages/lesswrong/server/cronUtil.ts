import { SyncedCron } from 'meteor/littledata:synced-cron';
import { Meteor } from 'meteor/meteor';

SyncedCron.options = {
  log: true,
  collectionName: 'cronHistory',
  utc: false,
  collectionTTL: 172800
};

export function addCronJob(options: any)
{
  Meteor.startup(function() {
    if (!Meteor.isTest && !Meteor.isAppTest && !Meteor.isPackageTest) {
      // Defer starting of cronjobs until 20s after server startup
      Meteor.setTimeout(() => {
        SyncedCron.add(options);
      }, 20000);
    }
  });
}
