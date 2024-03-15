import React from "react";
import { useCurationEmailsCron } from "../../lib/betas";
import CurationEmails from "../../lib/collections/curationEmails/collection";
import LWEvents from "../../lib/collections/lwevents/collection";
import { Posts } from "../../lib/collections/posts";
import Users from "../../lib/collections/users/collection";
import { forumTitleSetting, isEAForum } from "../../lib/instanceSettings";
import { randomId } from "../../lib/random";
import { Components } from "../../lib/vulcan-lib/components";
import { addCronJob } from "../cronUtil";
import { wrapAndSendEmail } from "../emails";
import CurationEmailsRepo from "../repos/CurationEmailsRepo";
import { Globals } from "../vulcan-lib";

import chunk from "lodash/chunk";
import moment from "moment";

let jobLock = false;

export async function findUsersToEmail(filter: MongoSelector<DbUser>) {
  let usersMatchingFilter = await Users.find(filter).fetch();
  if (isEAForum) {
    return usersMatchingFilter
  }

  let usersToEmail = usersMatchingFilter.filter(u => {
    if (u.email && u.emails && u.emails.length) {
      let primaryAddress = u.email;

      for(let i=0; i<u.emails.length; i++)
      {
        if(u.emails[i] && u.emails[i].address === primaryAddress && u.emails[i].verified)
          return true;
      }
      return false;
    } else {
      return false;
    }
  });
  return usersToEmail
}

export async function sendCurationEmail({users, postId, reason, subject}: {
  users: Array<DbUser>,
  postId: string,
  reason: string,
  
  // Subject line to use in the email. If omitted, uses the post title.
  subject?: string,
}) {
  // We *could* optimize to avoid refetching the post for every single user we email...
  // ...but it might actually be better to not, since this allows us to e.g. edit the post after the job has started if there's some egregious issue
  const post = await Posts.findOne(postId);
  if (!post) throw Error(`Can't find post to send by email: ${postId}`)

  const curationEmailsRepo = new CurationEmailsRepo();
  
  for (const user of users) {
    await wrapAndSendEmail({
      user,
      subject: subject ?? post.title,
      body: <Components.NewPostEmail documentId={post._id} reason={reason}/>
    });

    await curationEmailsRepo.recordSentEmail(user._id, post._id);
  }
}

async function initialCurationEmailsHydration(lastCuratedPost: DbPost) {
  // NOTE: forumTitleSetting is not guaranteed to be the same when running a local instance as when running in prod
  // If you want to manually hydrate the table before deploying this PR to check that everything looks good, you may need to hard-code the prod forumTitleSetting to run this locally.
  const sitename = forumTitleSetting.get();
  const subject = `[${sitename}] ${lastCuratedPost.title}`;
  // Get the last batch of emails sent out for that post.  Note that this might also include emails for users who are subscribed to that author, rather than just curation emails.
  const sentEmailEvents = await LWEvents.find({
    name: 'emailSent',
    'properties.subject': subject,
    createdAt: { $gt: lastCuratedPost.curatedDate }
  }, undefined, { userId: 1, createdAt: 1 }).fetch();

  const sentEmails = sentEmailEvents.map(({ userId, createdAt }) => ({ userId, createdAt }));
  const sentEmailUserIds = sentEmails.map(({ userId }) => userId);

  // Get the list of userIds which are actually subscribed to curated emails.
  // This isn't guaranteed to be a perfect match to the set of users who were subscribed at the time that the last batch of curated emails were sent out,
  // but it's close enough, and we're not relying on this to figure out which users to email, so much as which users to *not* email (since we've already sent them an email)
  const subscribedUserIds = await Users.find({
    _id: { $in: sentEmailUserIds },
    emailSubscribedToCurated: true,
    // `{ $ne: true }` rather than just `false` because they can be null (and most are), and `IS FALSE` filters out null values.
    unsubscribeFromAll: { $ne: true },
    deleted: { $ne: true },
    email: { $exists: true },
  }, undefined, { _id: 1 }).fetch();

  const subscribedUserIdSet = new Set(subscribedUserIds.map(({ _id }) => _id));
  const sentCuratedEmails = sentEmails.filter(email => email.userId && subscribedUserIdSet.has(email.userId));

  const bulkWriteOperations = sentCuratedEmails.map(({ userId, createdAt }) => ({
    insertOne: {
      document: {
        userId,
        postId: lastCuratedPost._id,
        updatedAt: createdAt,
        createdAt,
        _id: randomId(),
        schemaVersion: 1,
      }
    }
  }));

  if (bulkWriteOperations.length) {
    for (const batch of chunk(bulkWriteOperations, 1000)) {
      await CurationEmails.rawCollection().bulkWrite(batch);
    }
  }

  return bulkWriteOperations.length;
}


function isWithinSanityCheckPeriod(post: DbPost) {
  const twentyMinutesAgo = moment().subtract(20, 'minutes');
  return moment(post.curatedDate).isAfter(twentyMinutesAgo);
}

async function sendCurationEmails() {
  // I can't actually figure out whether a cron job which (sometimes) takes longer to run than its interval risks having multiple copies of itself running at once.
  // I hope not, but if it does, this will prevent whatever instance is responsible for running cron jobs from running multiple copies concurrently
  if (jobLock) return;

  jobLock = true;

  try {
    const lastCuratedPost = await Posts.findOne({ curatedDate: { $exists: true } }, { sort: { curatedDate: -1 } });
    // We specifically don't want to include the curatedDate filter in the SQL query because we want to skip doing anything if a post was newly curated in the last 20 minutes
    if (!lastCuratedPost || isWithinSanityCheckPeriod(lastCuratedPost)) {
      return;
    }

    // We check if this job is running for the first time and the CurationEmails table hasn't been hydrated with the last batch of curation emails to send out
    const curationEmailsExist = await CurationEmails.findOneArbitrary();
    if (!curationEmailsExist) {
      const hydratedRecordCount = await initialCurationEmailsHydration(lastCuratedPost);
      // If the hydration didn't insert any records, that means one of two things:
      // 1. This is the first post that's ever been curated, which means it correctly didn't find any previous emails sent out for curation
      // 2. Something went wrong. Most likely is some issue with the forumSiteName, which is used to find previous curation emails (it's included in the subject line)
      // If something like that went wrong, we don't want to proceed without understanding what's going on.  I recommend running the initial hydration manually.
      if (hydratedRecordCount === 0) {
        const curatedPostCount = await Posts.find({ curatedDate: { $exists: true } }).count();
        if (curatedPostCount > 1)
          // eslint-disable-next-line no-console
          console.error(`${curatedPostCount} posts have been curated, but CurationEmails was not successfully hydrated with the last post's emails.`);
          return;
      }
    }

    // If there are no users who need to be emailed (tl;dr: users who are subscribed and haven't already received an email for this post), early return
    // Since we'll be in the state where there are no users to email most of the time, the query only fetches userIds, since it's much cheaper with a covering index,
    // and this job will be running relatively frequently.  So we optimize a bit to reduce DB load.
    const curationEmailsRepo = new CurationEmailsRepo();
    const userIdsToEmail = await curationEmailsRepo.getUserIdsToEmail(lastCuratedPost._id);
    if (userIdsToEmail.length === 0) {
      return;
    }

    // If we do have users who need to be emailed, fetch them
    const usersToEmail = await Users.find({ _id: { $in: userIdsToEmail } }).fetch();

    await sendCurationEmail({
      users: usersToEmail,
      postId: lastCuratedPost._id,
      reason: "you have the \"Email me new posts in Curated\" option enabled"
    });

  } finally {
    jobLock = false;
  }
}

if (useCurationEmailsCron) {
  addCronJob({
    name: 'updateUserActivitiesCron',
    interval: 'every 1 minute',
    async job() {
      await sendCurationEmails();
    }
  });
}

Globals.initialCurationEmailsHydration = async () => {
  const lastCuratedPost = await Posts.findOne({ curatedDate: { $exists: true } }, { sort: { curatedDate: -1 } });
  // We specifically don't want to include the curatedDate filter in the SQL query because we want to skip doing anything if a post was newly curated in the last 20 minutes
  if (!lastCuratedPost || isWithinSanityCheckPeriod(lastCuratedPost)) {
    return;
  }

  const hydratedRecordCount = await initialCurationEmailsHydration(lastCuratedPost);
  // eslint-disable-next-line no-console
  console.log({ hydratedRecordCount });
};
