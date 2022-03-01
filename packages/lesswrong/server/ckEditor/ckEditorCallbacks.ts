import { randomSecret } from '../../lib/random';
import { getCollectionHooks } from '../mutationCallbacks';
import { addGraphQLMutation, addGraphQLResolvers } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts/collection';
import { defineQuery, defineMutation } from '../utils/serverGraphqlUtil';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import * as _ from 'underscore';
import crypto from 'crypto';

export function generateLinkSharingKey(): string {
  return randomSecret();
}

getCollectionHooks("Posts").newSync.add(function addLinkSharingKey(post: DbPost): DbPost {
  return {
    ...post,
    linkSharingKey: generateLinkSharingKey()
  };
});


getCollectionHooks("Posts").updateBefore.add(function onEditAddLinkSharingKey(post: Partial<DbPost>): Partial<DbPost> {
  if (!post.linkSharingKey) {
    return {
      ...post,
      linkSharingKey: generateLinkSharingKey()
    };
  } else {
    return post;
  }
});

defineMutation({
  name: "unlockPost",
  resultType: "Post",
  argTypes: "(postId: String!, linkSharingKey: String!)",
  fn: async (root: void, {postId, linkSharingKey}: {postId: string, linkSharingKey: string}, context: ResolverContext) => {
    // Must be logged in
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in");
    }
    
    // Post must exist and have link-sharing
    const post = await Posts.findOne({_id: postId});
    if (!post?.sharingSettings?.anyoneWithLinkCan || post.sharingSettings.anyoneWithLinkCan==="none") {
      throw new Error("Invalid postId");
    }
    
    // Provided link-sharing key must be correct
    if (post.linkSharingKey !== linkSharingKey) {
      throw new Error("Incorrect link-sharing key");
    }
    
    if (!_.contains(post.linkSharingKeyUsedBy, currentUser._id)) {
      await Posts.update(
        {_id: postId},
        {$set: {
          linkSharingKeyUsedBy: [...post.linkSharingKeyUsedBy, currentUser._id]
        }}
      );
    }
  }
});

defineQuery({
  name: "getLinkSharedPost",
  resultType: "Post",
  argTypes: "(postId: String!, linkSharingKey: String!)",
  fn: async (root: void, {postId, linkSharingKey}: {postId: string, linkSharingKey: string}, context: ResolverContext) => {
    // Must be logged in
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in");
    }
    
    // Post must exist
    const post = await Posts.findOne({_id: postId});
    
    if (!post) {
      throw new Error("Invalid postId or not shared with you");
    }
    
    // Either:
    //  * The logged-in user is explicitly shared on this post
    //  * Link-sharing is enabled and a correct link-sharing key is provided
    //  * Link-sharing is enabled and the post doesn't have a link-sharing key
    //  * Link-sharing is enabled and this user has provided the correct key in
    //    the past
    if (
      (post?.shareWithUsers && _.contains(post.shareWithUsers, currentUser._id))
      || (linkSharingEnabled(post)
          && (!post.linkSharingKey || constantTimeCompare(post.linkSharingKey, linkSharingKey)))
      || (linkSharingEnabled(post) && _.contains(post.linkSharingKeyUsedBy, currentUser._id))
    ) {
      // Add the user to linkSharingKeyUsedBy, if not already there
      if (!post.linkSharingKeyUsedBy || !_.contains(post.linkSharingKeyUsedBy, currentUser._id)) {
        await Posts.update(
          {_id: post._id},
          {$addToSet: {linkSharingKeyUsedBy: currentUser._id}}
        );
      }
      
      // Return the post
      const filteredPost = await accessFilterSingle(currentUser, Posts, post, context);
      return post;
    } else {
      throw new Error("Invalid postId or not shared with you");
    }
  }
});

function linkSharingEnabled(post: DbPost) {
  return post.sharingSettings?.anyoneWithLinkCan && post.sharingSettings.anyoneWithLinkCan!=="none";
}

function constantTimeCompare(a: string, b: string) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}
