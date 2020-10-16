import { onStartup } from '../../lib/executionEnvironment';
import { startSyncedCron } from '../cronUtil';
import { DatabaseServerSetting } from '../databaseSettings';

export const mailUrlSetting = new DatabaseServerSetting<string | null>('mailUrl', null) // The SMTP URL used to send out email

if (mailUrlSetting.get()) {
  process.env.MAIL_URL = mailUrlSetting.get() || undefined;
}

onStartup(function() {
  startSyncedCron();
});

