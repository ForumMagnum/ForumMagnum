import { getCollectionHooks } from '../mutationCallbacks';
import { wrapAndSendEmail } from '../emails/renderEmail';
import '../emailComponents/EmailJobAdReminder';
import React from 'react';
import { Components } from '../../lib/vulcan-lib';
import { JOB_AD_DATA } from '../../components/ea-forum/TargetedJobAd';
import moment from 'moment';

getCollectionHooks("UserJobAds").updateAsync.add(async function setJobAdReminderEmail(
  {document, oldDocument, currentUser}: {document: DbUserJobAd, oldDocument: DbUserJobAd, currentUser: DbUser|null}
) {
  // Skip if we can't email this user
  if (!currentUser || !currentUser.email || currentUser.deleted) return
  
  // If the job has no deadline, skip it
  if (!(document.jobName in JOB_AD_DATA) || !JOB_AD_DATA[document.jobName].deadline) return

  // If the user clicked on the "Remind me" button, send them an email reminder of the job
  if (oldDocument.adState !== 'reminderSet' && document.adState === 'reminderSet') {
    const jobAdData = JOB_AD_DATA[document.jobName]
    // If the deadline is less than a week away, just send the email now
    if (moment().add(1, 'week').isAfter(jobAdData.deadline)) {
      await wrapAndSendEmail({
        user: currentUser,
        subject: `Reminder: ${jobAdData.role} role at${jobAdData.insertThe ? ' the ' : ' '}${jobAdData.org}`,
        body: <Components.EmailJobAdReminder jobName={document.jobName} />,
        force: true  // ignore the "unsubscribe to all" in this case, since the user initiated it
      })
    }
    // Otherwise, we'll send it a week before the deadline
    // (see sendJobAdReminderEmails in userJobAdCron.tsx)
  }
})
