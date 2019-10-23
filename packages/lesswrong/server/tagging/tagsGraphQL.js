import { newMutation, addGraphQLMutation, addGraphQLResolvers } from 'meteor/vulcan:core';
import { TagRels } from '../../lib/collections/tagRels/collection.js';
import { performVoteServer } from '../voteServer.js';

addGraphQLResolvers({
  Mutation: {
    addOrUpvoteTag: async (root, { tagId, postId }, { currentUser }) => {
      if (!currentUser) throw new Error("You must be logged in to tag");
      if (!postId) throw new Error("Missing argument: postId");
      if (!tagId) throw new Error("Missing argument: tagId");
      
      // Validate that tagId and postId refer to valid non-deleted documents
      // and that this user can see both.
      // TODO
      
      // Check whether this document already has this tag applied
      const existingTagRel = TagRels.findOne({ tagId, postId });
      if (!existingTagRel) {
        const tagRel = await newMutation({
          collection: TagRels,
          document: { tagId, postId },
          validate: false,
          currentUser,
        });
        return tagRel;
      } else {
        // Upvote the tag
        const votedTagRel = await performVoteServer({
          document: existingTagRel,
          voteType: 'smallUpvote',
          collection: TagRels,
          user: currentUser
        });
        return votedTagRel;
      }
    }
  }
});
addGraphQLMutation('addOrUpvoteTag(tagId: String, postId: String): TagRel');
