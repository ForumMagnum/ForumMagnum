import { SyncedCron } from 'meteor/percolatestudio:synced-cron';

SyncedCron.options = {
  log: true,
  collectionName: 'cronHistory',
  utc: false,
  collectionTTL: 172800
};

export function addCronJob(options)
{
  Meteor.startup(function() {
    if (!Meteor.isTest && !Meteor.isAppTest && !Meteor.isPackageTest) {
      SyncedCron.add(options);
    }
  });
}
