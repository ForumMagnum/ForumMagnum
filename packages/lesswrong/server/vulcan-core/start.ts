import { SyncedCron } from 'meteor/littledata:synced-cron';
import { onStartup } from '../../lib/executionEnvironment';
import { Inject } from 'meteor/meteorhacks:inject-initial';
import { DatabaseServerSetting } from '../databaseSettings';

export const mailUrlSetting = new DatabaseServerSetting<string | null>('mailUrl', null) // The SMTP URL used to send out email

if (mailUrlSetting.get()) {
  process.env.MAIL_URL = mailUrlSetting.get() || undefined;
}

onStartup(function() {
  if (typeof SyncedCron !== 'undefined') {
    SyncedCron.start();
  }
});

Inject.obj('serverTimezoneOffset', {offset: new Date().getTimezoneOffset()});
