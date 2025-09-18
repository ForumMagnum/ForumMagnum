import React from "react";
import Posts from "../collections/posts/collection";
import Users from "../collections/users/collection"
import { DatabaseServerSetting } from "../databaseSettings";
import { PostsEmail } from "../emailComponents/PostsEmail";
import { wrapAndSendEmail } from "../emails/renderEmail";
import { createUnsubscribeMarketingNode } from "../emails/unsubscribeLink";
import { forEachDocumentBatch } from "../manualMigrations/migrationUtils";
import UsersRepo from "../repos/UsersRepo";

// The "sender" for event post emails - will use the normal default email
// sender if not defined
const eventPostEmailSetting = new DatabaseServerSetting<string | undefined>(
  "eventPostEmail",
  undefined,
);

const sendEventPostEmail = async (post: DbPost, user: DbUser, subject: string) => {
  const unsubscribeNode = await createUnsubscribeMarketingNode(user);
  await wrapAndSendEmail({
    user,
    from: eventPostEmailSetting.get(),
    subject,
    body: (
      <PostsEmail
        postIds={[post._id]}
        reason="you have marketing emails from the Forum enabled"
        hideRecommendations
      />
    ),
    tag: "eventPost",
    utmParams: {
      utm_source: `eventPost-${post._id}`,
      utm_medium: "email",
      utm_user_id: user._id,
    },
    unsubscribeNode,
  });
}

export const sendEventPostEmailById = async (
  postId: string,
  userId: string,
  subject: string,
) => {
  const [post, user] = await Promise.all([
    Posts.findOne({_id: postId}),
    Users.findOne({_id: userId}),
  ]);
  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  return sendEventPostEmail(post, user, subject);
}

export const sendEventPostEmails = async (postId: string, subject: string) => {
  const post = await Posts.findOne({_id: postId});
  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }
  const usersRepo = new UsersRepo();
  await forEachDocumentBatch<DbUser, "_id">({
    batchSize: 50,
    sortField: "_id",
    fetchCallback: (limit, afterUserId) => usersRepo.getUsersForEventPostEmails({
      limit,
      afterUserId,
    }),
    actionCallback: async (users) => {
      await Promise.all(users.map((user) => sendEventPostEmail(post, user, subject)));
    },
  });
}
