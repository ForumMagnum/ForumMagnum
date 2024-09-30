import React from 'react';
import { isEAForum } from "@/lib/instanceSettings";
import { loggerConstructor } from "@/lib/utils/logging";
import UsersRepo from "../repos/UsersRepo";
import { wrapAndSendEmail } from "../emails/renderEmail";
import { Components, Globals } from "@/lib/vulcan-lib";
import './../emailComponents/EmailAnnualForumUserSurvey';
import Users from '@/lib/collections/users/collection';

/**
 * Used by the EA Forum to send an email to a subset of users
 * asking them to fill in the annual user survey.
 *
 * The default limit is 10 to prevent accidentally emailing a lot
 * of users. This is safe to re-run since we track which users we
 * have already emailed via the userSurveyEmailSentAt field.
 *
 * In 2024, we emailed approximately 20k users total.
 */
const sendUserSurveyEmails = async (limit=10) => {
  if (!isEAForum) return
  
  const logger = loggerConstructor(`sendUserSurveyEmails`)
  
  // Get the list of users that we want to email about the user survey
  const users = await new UsersRepo().getUsersForUserSurveyEmail(limit)
  if (!users.length) {
    logger(`No users found`)
    return
  }
  
  logger(`Sending user survey emails to ${users.length} users`)
  const now = new Date()
  for (let user of users) {
    try {
      await wrapAndSendEmail({
        user,
        from: 'EA Forum Team <eaforum@centreforeffectivealtruism.org>',
        subject: `We’d love to hear from you! Fill out the 2024 EA Forum user survey`,
        body: <Components.EmailAnnualForumUserSurvey user={user} />,
      })
      await Users.rawUpdateOne(
        {_id: user._id},
        {$set: {userSurveyEmailSentAt: now}}
      )
    } catch (e) {
      logger(`Error sending email to ${user._id}:`, e)
    }
  }
  
  logger(`Sent user survey emails to ${users.length} users`)
}

Globals.sendUserSurveyEmails = sendUserSurveyEmails;
