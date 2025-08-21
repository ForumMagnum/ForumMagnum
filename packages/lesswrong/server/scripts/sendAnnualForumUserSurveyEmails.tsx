import React from 'react';
import { isEAForum } from "@/lib/instanceSettings";
import { loggerConstructor } from "@/lib/utils/logging";
import UsersRepo from "../repos/UsersRepo";
import { wrapAndSendEmail } from "../emails/renderEmail";
import Users from '@/server/collections/users/collection';
import { EmailAnnualForumUserSurvey } from './../emailComponents/EmailAnnualForumUserSurvey';

/**
 * Used by the EA Forum to send an email to a subset of users
 * asking them to fill in the annual user survey.
 *
 * The default limit is 10 to prevent accidentally emailing a lot
 * of users. This is safe to re-run since we track which users we
 * have already emailed via the userSurveyEmailSentAt field.
 *
 * In 2024, we emailed approximately 20k users total.
 * In 2025, we emailed approximately 16k users total.
 *
 * TODO next year: skip emailing users who have already filled out the survey
 *
 * Exported to allow running manually with "yarn repl"
 */
export const sendUserSurveyEmails = async (limit=10) => {
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
        subject: `We’d love to hear from you! Fill out the 2025 EA Forum user survey`,
        body: <EmailAnnualForumUserSurvey user={user} />,
        tag: "annual-forum-survey",
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

