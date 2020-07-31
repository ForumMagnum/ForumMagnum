import { SyncedCron } from 'meteor/littledata:synced-cron';
import { Meteor } from 'meteor/meteor';
import { Inject } from 'meteor/meteorhacks:inject-initial';
import { mailUrlSetting } from '../../lib/instanceSettings';

if (mailUrlSetting.get()) {
  process.env.MAIL_URL = mailUrlSetting.get() || undefined;
}

Meteor.startup(function() {
  if (typeof SyncedCron !== 'undefined') {
    SyncedCron.start();
  }
});

Inject.obj('serverTimezoneOffset', {offset: new Date().getTimezoneOffset()});
