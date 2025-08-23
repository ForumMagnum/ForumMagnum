import React from "react";
import { useCurationEmailsCron } from "../../lib/betas";
import CurationEmails from "../../server/collections/curationEmails/collection";
import { Posts } from "../../server/collections/posts/collection";
import Users from "../../server/collections/users/collection";
import { isEAForum, testServerSetting } from "../../lib/instanceSettings";
import { randomId } from "../../lib/random";
import { addCronJob } from "../cron/cronUtil";
import { wrapAndSendEmail } from "../emails/renderEmail";
import CurationEmailsRepo from "../repos/CurationEmailsRepo";
import UsersRepo from "../repos/UsersRepo";

import chunk from "lodash/chunk";
import moment from "moment";
import { PostsEmail } from "../emailComponents/PostsEmail";

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
  if (!post.curatedDate) throw Error(`Post is not curated`);

  for (const user of users) {
    await wrapAndSendEmail({
      user,
      subject: subject ?? post.title,
      body: <PostsEmail postIds={[post._id]} reason={reason}/>
    });
  }
}

export async function hydrateCurationEmailsQueue(postId: string) {
  const usersRepo = new UsersRepo();

  const userIdsToEmail = await usersRepo.getCurationSubscribedUserIds();
  const now = new Date();

  const bulkWriteOperations = userIdsToEmail.map((userId) => ({
    insertOne: {
      document: {
        userId,
        postId,
        createdAt: now,
        _id: randomId(),
        schemaVersion: 1,
        legacyData: null,
      }
    }
  }));

  if (bulkWriteOperations.length) {
    for (const batch of chunk(bulkWriteOperations, 1000)) {
      await CurationEmails.rawCollection().bulkWrite(batch);
    }
  }
}

function isWithinSanityCheckPeriod(post: DbPost) {
  const twentyMinutesAgo = moment().subtract(20, 'minutes');
  return moment(post.curatedDate).isAfter(twentyMinutesAgo);
}

async function sendCurationEmails() {
  const lastCuratedPost = await Posts.findOne({ curatedDate: { $exists: true } }, { sort: { curatedDate: -1 } });

  // We specifically don't want to include the curatedDate filter in the SQL query because we want to skip doing anything if a post was newly curated in the last 20 minutes
  if (!lastCuratedPost || isWithinSanityCheckPeriod(lastCuratedPost)) {
    return;
  }

  const curationEmailsRepo = new CurationEmailsRepo();

  // Picking up one user at a time from the queue means that even if multiple servers run separate instances of the cron job, we still don't double-send to any users
  let emailToSend = await curationEmailsRepo.removeFromQueue();

  while (emailToSend) {
    const user = await Users.findOne(emailToSend.userId);

    if (user) {
      await sendCurationEmail({
        users: [user],
        postId: emailToSend.postId,
        reason: "you have the \"Email me new posts in Curated\" option enabled"
      });
    }

    emailToSend = await curationEmailsRepo.removeFromQueue();
  }
}

export const sendCurationEmailsCron = addCronJob({
  name: 'sendCurationEmailsCron',
  interval: 'every 1 minute',
  disabled: testServerSetting.get() || !useCurationEmailsCron,
  async job() {
    await sendCurationEmails();
  }
});
