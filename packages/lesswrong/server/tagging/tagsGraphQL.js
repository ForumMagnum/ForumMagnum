import { newMutation, addGraphQLSchema, addGraphQLMutation, addGraphQLResolvers } from 'meteor/vulcan:core';
import { TagRels } from '../../lib/collections/tagRels/collection.js';

addGraphQLSchema(`
  type AddOrUpvoteTagResult {
    tag: Tag!
    tagRel: TagRel!
  }
`);

addGraphQLResolvers({
  Mutation: {
    addOrUpvoteTag: async (root, { tagId, postId }, { currentUser }) => {
      if (!currentUser) throw new Error("You must be logged in to tag");
      if (!postId) throw new Error("Missing argument: postId");
      if (!tagId) throw new Error("Missing argument: tagId");
      
      console.log(`In addOrUpvoteTag(tagId: ${tagId}, postId: ${postId})`);
      console.log(`currentUser: ${currentUser?.displayName}`);
      
      // Validate that tagId and postId refer to valid non-deleted documents
      // and that this user can see both.
      // TODO
      
      // Check whether this document already has this tag applied
      const existingTagRel = TagRels.findOne({ tagId, postId });
      if (!existingTagRel) {
        console.log("Tag relation does not exist; creating");
        await newMutation({
          collection: TagRels,
          document: { tagId, postId },
          validate: false,
          currentUser,
        });
        // TODO
      }
      
      // Now upvote the tag
      // TODO
    }
  }
});
addGraphQLMutation('addOrUpvoteTag(tagId: String, postId: String): AddOrUpvoteTagResult');
