import { newMutation, addGraphQLMutation, addGraphQLResolvers } from 'meteor/vulcan:core';
import { Tags } from '../../lib/collections/tags/collection.js';
import { TagRels } from '../../lib/collections/tagRels/collection.js';
import { Posts } from '../../lib/collections/posts/collection.js';
import { performVoteServer } from '../voteServer.js';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';

addGraphQLResolvers({
  Mutation: {
    addOrUpvoteTag: async (root, { tagId, postId }, { currentUser }) => {
      if (!currentUser) throw new Error("You must be logged in to tag");
      if (!postId) throw new Error("Missing argument: postId");
      if (!tagId) throw new Error("Missing argument: tagId");
      
      // Validate that tagId and postId refer to valid non-deleted documents
      // and that this user can see both.
      const post = Posts.findOne({_id: postId});
      const tag = Tags.findOne({_id: tagId});
      if (!accessFilterSingle(currentUser, Posts, post))
        throw new Error("Invalid postId");
      if (!accessFilterSingle(currentUser, Tags, tag))
        throw new Error("Invalid tagId");
      
      // Check whether this document already has this tag applied
      const existingTagRel = TagRels.findOne({ tagId, postId });
      if (!existingTagRel) {
        const tagRel = await newMutation({
          collection: TagRels,
          document: { tagId, postId, userId: currentUser._id },
          validate: false,
          currentUser,
        });
        return tagRel.data;
      } else {
        // Upvote the tag
        // TODO: Don't *remove* an upvote in this case
        const votedTagRel = await performVoteServer({
          document: existingTagRel,
          voteType: 'smallUpvote',
          collection: TagRels,
          user: currentUser,
          toggleIfAlreadyVoted: false,
        });
        return votedTagRel;
      }
    }
  }
});
addGraphQLMutation('addOrUpvoteTag(tagId: String, postId: String): TagRel');
