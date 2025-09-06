import { isCollaborative, canUserEditPostMetadata } from '@/lib/collections/posts/helpers';
import { Posts } from '../../server/collections/posts/collection';
import { Revisions } from '../../server/collections/revisions/collection';
import { constantTimeCompare } from '../../lib/helpers';
import { randomSecret } from '../../lib/random';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { restrictViewableFields } from '@/lib/vulcan-users/restrictViewableFields';
import { revisionIsChange } from '../editor/make_editable_callbacks';
import { ckEditorApiHelpers } from './ckEditorApi';
import gql from 'graphql-tag';
import { updatePost } from '../collections/posts/mutations';

export const ckEditorCallbacksGraphQLTypeDefs = gql`
  extend type Query {
    getLinkSharedPost(postId: String!, linkSharingKey: String!): Post
  }
  extend type Mutation {
    unlockPost(postId: String!, linkSharingKey: String!): Post
    revertPostToRevision(postId: String!, revisionId: String!): Post
  }
`

export const getLinkSharedPostGraphQLQueries = {
  getLinkSharedPost: async (root: void, {postId, linkSharingKey}: {postId: string, linkSharingKey: string}, context: ResolverContext) => {
    // Must be logged in
    const { currentUser } = context;
    
    // Post must exist
    const post = await Posts.findOne({_id: postId});
    
    if (!post) {
      throw new Error("Invalid postId or not shared with you");
    }

    const canonicalLinkSharingKey = post.linkSharingKey;
    const keysMatch = !!canonicalLinkSharingKey && constantTimeCompare({ correctValue: canonicalLinkSharingKey, unknownValue: linkSharingKey });  
    
    // Either:
    //  * The logged-in user is explicitly shared on this post
    //  * Link-sharing is enabled and a correct link-sharing key is provided
    //  * Link-sharing is enabled and the post doesn't have a link-sharing key
    //  * Link-sharing is enabled and this user has provided the correct key in
    //    the past
    //  * The logged-in user is the post author
    //  * The logged in user is an admin or moderator (or otherwise has edit permissions)

    if (
      (post.shareWithUsers && currentUser?._id && post.shareWithUsers.includes(currentUser._id))
      || (linkSharingEnabled(post) && (!canonicalLinkSharingKey || keysMatch))
      || (linkSharingEnabled(post) && (currentUser && post.linkSharingKeyUsedBy?.includes(currentUser._id)))
      || currentUser?._id === post.userId
      || userCanDo(currentUser, 'posts.edit.all')
    ) {
      // Add the user to linkSharingKeyUsedBy, if not already there
      if (currentUser && (!post.linkSharingKeyUsedBy || !post.linkSharingKeyUsedBy.includes(currentUser._id))) {
        // FIXME: This is a workaround for the fact that $addToSet hasn't yet been implemented for postgres. We should
        // switch to just using the second version because it should avoid errors with concurrent updates.
        await Posts.rawUpdateOne(
          {_id: post._id},
          {$set: {linkSharingKeyUsedBy: [...(post.linkSharingKeyUsedBy || []), currentUser._id]}}
        );
      }
      
      // Return the post
      const filteredPost = restrictViewableFields(currentUser, Posts, post);
      return filteredPost;
    } else {
      throw new Error("Invalid postId or not shared with you");
    }
  }
}

export const ckEditorCallbacksGraphQLMutations = {
  unlockPost: async (root: void, {postId, linkSharingKey}: {postId: string, linkSharingKey: string}, context: ResolverContext) => {
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
    
    if (post.linkSharingKeyUsedBy && !(post.linkSharingKeyUsedBy?.includes(currentUser._id))) {
      await Posts.rawUpdateOne(
        {_id: postId},
        {$set: {
          linkSharingKeyUsedBy: [...post.linkSharingKeyUsedBy, currentUser._id]
        }}
      );
    }
  },
  revertPostToRevision: async (root: void, {postId, revisionId}: {postId: string, revisionId: string}, context: ResolverContext) => {
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
    if (!canUserEditPostMetadata(currentUser, post)) {
      throw new Error("You don't have write access to this post");
    }
    
    // Revision must exist and be a revision of the right post
    const revision = await Revisions.findOne({_id: revisionId});
    if (!revision) throw new Error("Invalid revision ID");
    if (!revision.originalContents) throw new Error("Missing originalContents");
    if (revision.documentId !== post._id) throw new Error("Revision is not for this post");
    
    // Is the selected revision a CkEditor collaborative editing revision?
    if (revision.originalContents.type === "ckEditorMarkup" && isCollaborative(post, "contents")) {
      // eslint-disable-next-line no-console
      console.log("Reverting to a CkEditor collaborative revision");
      await ckEditorApiHelpers.pushRevisionToCkEditor(post._id, revision.originalContents.data);
    } else {
      // eslint-disable-next-line no-console
      console.log("Reverting to a non-collaborative revision");
      if (await revisionIsChange(revision, "contents", context)) {
        // Edit the document to set contents to match this revision. Edit callbacks
        // take care of the rest.
        await updatePost({
          data: {
            // Contents is a resolver only field, but there is handling for it
            // in `createMutator`/`updateMutator`
            contents: {
              originalContents: revision.originalContents,
            },
          },
          selector: { _id: post._id }
        }, context);
      } else {
        // eslint-disable-next-line no-console
        console.log("Not creating a new revision (it already matches the head revision");
      }
    }
    
    const filteredPost = await accessFilterSingle(currentUser, 'Posts', post, context);
    return filteredPost!;
  }
}

function linkSharingEnabled(post: DbPost) {
  return post.sharingSettings?.anyoneWithLinkCan && post.sharingSettings.anyoneWithLinkCan!=="none";
}
