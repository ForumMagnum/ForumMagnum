import React from "react";
import Posts from "../collections/posts/collection";
import Users from "../collections/users/collection"
import { PostsEmail } from "../emailComponents/PostsEmail";
import { wrapAndSendEmail } from "../emails/renderEmail";

export const sendEventPostEmail = async (postId: string, userId: string) => {
  const [post, user] = await Promise.all([
    Posts.findOne({_id: postId}),
    Users.findOne({_id: userId})
  ]);
  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
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
