import React from 'react';
import moment from 'moment';
import { JOB_AD_DATA } from '../components/ea-forum/TargetedJobAd';
import { addCronJob } from './cron/cronUtil';
import UserJobAds from '../server/collections/userJobAds/collection';
import { Users } from '../server/collections/users/collection';
import uniq from 'lodash/fp/uniq';
import { wrapAndSendEmail } from './emails/renderEmail';
import { loggerConstructor } from '../lib/utils/logging';
import { isEAForum } from '../lib/instanceSettings';
import { EmailJobAdReminder } from './emailComponents/EmailJobAdReminder';

// Exported to allow running with "yarn repl"
export const sendJobAdReminderEmails = async () => {
  if (!isEAForum) return

  const logger = loggerConstructor(`cron-sendJobAdReminderEmails`)

  // Find all the job ads where the deadline is 2 days away
  const jobNames = Object.keys(JOB_AD_DATA).filter(jobName => {
    const deadline = JOB_AD_DATA[jobName].deadline
    return deadline && moment().add(2, 'days').isSameOrBefore(deadline) && moment().add(3, 'days').isAfter(deadline)
  })
  if (!jobNames.length) {
    logger('No eligible jobs found')
    return
  }

  // Find all the user reminders set for these jobs
  const userJobAds = await UserJobAds.find({
    jobName: {$in: jobNames},
    reminderSetAt: {$exists: true},
  }).fetch()
  if (!userJobAds.length) {
    logger(`No users to remind for jobs: ${jobNames.join(', ')}`)
    return
  }
  
  // Get all the email recipient data
  const users = await Users.find({
    _id: {$in: uniq(userJobAds.map(u => u.userId))},
    email: {$exists: true},
    deleteContent: {$ne: true},
    deleted: {$ne: true}
  }).fetch()
  if (!users.length) {
    logger(`No user data found for reminders for jobs: ${jobNames.join(', ')}`)
    return
  }
  
  for (let userJobAd of userJobAds) {
    const recipient = users.find(u => u._id === userJobAd.userId)
    if (recipient) {
      const jobAdData = JOB_AD_DATA[userJobAd.jobName]
      void wrapAndSendEmail({
        user: recipient,
        subject: `Reminder: ${jobAdData.role} role at${jobAdData.insertThe ? ' the ' : ' '}${jobAdData.org}`,
        body: <EmailJobAdReminder jobName={userJobAd.jobName} />,
        tag: "user-job-ad",
        force: true  // ignore the "unsubscribe to all" in this case, since the user initiated it
      })
    }
  }
  
  logger(`Sent email reminders for ${jobNames.join(', ')} to ${users.length} users`)
}

export const sendJobAdReminderEmailsCron = addCronJob({
  name: 'sendJobAdReminderEmails',
  interval: `every 1 day`,
  disabled: !isEAForum,
  job() {
    void sendJobAdReminderEmails();
  }
});

