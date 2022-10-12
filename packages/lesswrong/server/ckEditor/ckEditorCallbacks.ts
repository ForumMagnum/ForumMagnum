import { randomSecret } from '../../lib/random';
import { getCollectionHooks } from '../mutationCallbacks';
import { Posts } from '../../lib/collections/posts/collection';
import { canUserEditDbPostMetadata } from '../../lib/collections/posts/helpers';
import { Revisions } from '../../lib/collections/revisions/collection';
import { isCollaborative } from '../../components/editor/EditorFormComponent';
import { defineQuery, defineMutation } from '../utils/serverGraphqlUtil';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { restrictViewableFields } from '../../lib/vulcan-users/permissions';
import { revisionIsChange } from '../editor/make_editable_callbacks';
import { updateMutator } from '../vulcan-lib/mutators';
import { pushRevisionToCkEditor } from './ckEditorWebhook';
import * as _ from 'underscore';
import crypto from 'crypto';
import { userCanDo } from '../../lib/vulcan-users';

export function generateLinkSharingKey(): string {
  return randomSecret();
}

getCollectionHooks("Posts").newSync.add(function addLinkSharingKey(post: DbPost): DbPost {
  return {
    ...post,
    linkSharingKey: generateLinkSharingKey()
  };
});


getCollectionHooks("Posts").updateBefore.add(function onEditAddLinkSharingKey(data: Partial<DbPost>, {oldDocument}): Partial<DbPost> {
  if (!oldDocument.linkSharingKey) {
    return {
      ...data,
      linkSharingKey: generateLinkSharingKey()
    };
  } else {
    return data;
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
      await Posts.rawUpdateOne(
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
    //  * The logged-in user is the post author
    //  * The logged in user is an admin or moderator (or otherwise has edit permissions)
    if (
      (post.shareWithUsers && _.contains(post.shareWithUsers, currentUser._id))
      || (linkSharingEnabled(post)
          && (!post.linkSharingKey || constantTimeCompare(post.linkSharingKey, linkSharingKey)))
      || (linkSharingEnabled(post) && _.contains(post.linkSharingKeyUsedBy, currentUser._id))
      || currentUser._id === post.userId
      || userCanDo(currentUser, 'posts.edit.all')
    ) {
      // Add the user to linkSharingKeyUsedBy, if not already there
      if (!post.linkSharingKeyUsedBy || !_.contains(post.linkSharingKeyUsedBy, currentUser._id)) {
        await Posts.rawUpdateOne(
          {_id: post._id},
          {$addToSet: {linkSharingKeyUsedBy: currentUser._id}}
        );
      }
      
      // Return the post
      const filteredPost = restrictViewableFields(currentUser, Posts, post);
      return filteredPost;
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

defineMutation({
  name: "revertPostToRevision",
  resultType: "Post",
  argTypes: "(postId: String!, revisionId: String!)",
  fn: async (root: void, {postId, revisionId}: {postId: string, revisionId: string}, context: ResolverContext): Promise<DbPost> => {
    // Check permissions
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in");
    }
    
    // Post must exist
    const post = await Posts.findOne({_id: postId});
    
    if (!post) {
      throw new Error("Invalid postId or not shared with you");
    }
    
    // Must have write access to the post
    if (!canUserEditDbPostMetadata(currentUser, post)) {
      throw new Error("You don't have write access to this post");
    }
    
    // Revision must exist and be a revision of the right post
    const revision = await Revisions.findOne({_id: revisionId});
    if (!revision) throw new Error("Invalid revision ID");
    if (revision.documentId !== post._id) throw new Error("Revision is not for this post");
    
    // Is the selected revision a CkEditor collaborative editing revision?
    if (revision.originalContents.type === "ckEditorMarkup" && isCollaborative(post, "contents")) {
      // eslint-disable-next-line no-console
      console.log("Reverting to a CkEditor collaborative revision");
      await pushRevisionToCkEditor(post._id, revision.originalContents.data);
    } else {
      // eslint-disable-next-line no-console
      console.log("Reverting to a non-collaborative revision");
      if (await revisionIsChange(revision, "contents")) {
        // Edit the document to set contents to match this revision. Edit callbacks
        // take care of the rest.
        await updateMutator({
          collection: Posts,
          context,
          documentId: post._id,
          data: {
            contents: {
              originalContents: revision.originalContents,
            },
          },
          currentUser,
          validate: false,
        });
      } else {
        // eslint-disable-next-line no-console
        console.log("Not creating a new revision (it already matches the head revision");
      }
    }
    
    const filteredPost = await accessFilterSingle(currentUser, Posts, post, context);
    return filteredPost!;
  }
});
