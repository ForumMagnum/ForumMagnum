import React from 'react';
import { addCronJob } from './cronUtil';
import { wrapAndSendEmail } from './emails/renderEmail';
import './emailComponents/EmailInactiveUserSurvey';
import { Components, Globals } from './vulcan-lib';
import { loggerConstructor } from '../lib/utils/logging';
import { UsersRepo } from './repos';
import Users from '../lib/vulcan-users';
import { isEAForum } from '../lib/instanceSettings';


/**
 * Sends emails to inactive users with a link to a feedback survey
 */
const sendInactiveUserSurveyEmails = async () => {
  if (!isEAForum) return
  
  const logger = loggerConstructor(`cron-sendInactiveUserSurveyEmails`)
  
  // Get up to 40 inactive users to email
  const users = await new UsersRepo().getInactiveUsersToEmail(40)
  if (!users.length) {
    logger(`No inactive users found`)
    return
  }
  
  const now = new Date()
  for (let user of users) {
    try {
      void wrapAndSendEmail({
        user,
        from: 'EA Forum Team <eaforum@centreforeffectivealtruism.org>',
        subject: `Help us improve the site`,
        body: <Components.EmailInactiveUserSurvey user={user} />,
      })
      await Users.rawUpdateOne(
        {_id: user._id},
        {$set: {inactiveSurveyEmailSentAt: now}}
      )
    } catch (e) {
      logger(`Error sending email to ${user._id}:`, e)
    }
  }
  
  logger(`Sent inactive user survey emails to ${users.length} users`)
}

if (isEAForum) {
  addCronJob({
    name: 'sendInactiveUserSurveyEmails',
    interval: `every 1 day`,
    job() {
      void sendInactiveUserSurveyEmails();
    }
  });
}

Globals.sendInactiveUserSurveyEmails = sendInactiveUserSurveyEmails;
