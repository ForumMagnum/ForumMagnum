import React from "react";
import Posts from "../collections/posts/collection";
import Users from "../collections/users/collection"
import { PostsEmail } from "../emailComponents/PostsEmail";
import { wrapAndSendEmail } from "../emails/renderEmail";
import { forEachDocumentBatchInCollection } from "../manualMigrations/migrationUtils";

const sendEventPostEmail = async (post: DbPost, user: DbUser) => {
  await wrapAndSendEmail({
    user,
    subject: post.title,
    body: (
      <PostsEmail
        postIds={[post._id]}
        reason="you have marketing emails from the Forum enabled"
        hideRecommendations
      />
    ),
    tag: "eventPost",
  });
}

export const sendEventPostEmailById = async (postId: string, userId: string) => {
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
  return sendEventPostEmail(post, user);
}

export const sendEventPostEmails = async (postId: string) => {
  const post = await Posts.findOne({_id: postId});
  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }
  await forEachDocumentBatchInCollection({
    collection: Users,
    filter: {
      deleted: false,
      banned: {$exists: false},
      sendMarketingEmails: true,
      $or: [
        {unsubscribeFromAll: {$exists: false}},
        {unsubscribeFromAll: false},
      ],
    },
    batchSize: 50,
    callback: async (users) => {
      await Promise.all(users.map((user) => sendEventPostEmail(post, user)));
    },
  });
}
