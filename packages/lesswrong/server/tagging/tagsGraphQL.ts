import gql from 'graphql-tag';
import { Tags } from '../../server/collections/tags/collection';
import { TagRels } from '../../server/collections/tagRels/collection';
import { Posts } from '../../server/collections/posts/collection';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { createMutator } from "../vulcan-lib/mutators";

export const addOrUpvoteTag = async ({tagId, postId, currentUser, ignoreParent = false, context, selfVote = false}: {
  tagId: string,
  postId: string,
  currentUser: DbUser,
  ignoreParent?: boolean,
  context: ResolverContext,
  selfVote?: boolean,
}): Promise<DbTagRel> => {
  // Validate that tagId and postId refer to valid non-deleted documents
  // and that this user can see both.
  const post = await Posts.findOne({_id: postId});
  const tag = await Tags.findOne({_id: tagId});
  if (!await accessFilterSingle(currentUser, 'Posts', post, context))
    throw new Error(`Invalid postId ${postId}, either this post does not exist, or you do not have access`);
  if (!await accessFilterSingle(currentUser, 'Tags', tag, context))
    throw new Error(`Invalid tagId ${tagId}, either this tag does not exist, or you do not have access`);
  
  // Check whether this document already has this tag applied
  const existingTagRel = await TagRels.findOne({ tagId, postId, deleted: false });
  if (!existingTagRel) {
    const tagRel = await createMutator({
      collection: TagRels,
      document: { tagId, postId, userId: currentUser._id },
      validate: false,
      currentUser,
      context,
    });
    
    // If the tag has a parent which has not been applied to this post, apply it
    if (!ignoreParent && tag?.parentTagId && !await TagRels.findOne({ tagId: tag.parentTagId, postId })) {
      // RECURSIVE CALL, should only ever go one level deep because we disallow chaining of parent tags (see packages/lesswrong/lib/collections/tags/schema.ts)
      await addOrUpvoteTag({tagId: tag?.parentTagId, postId, currentUser, context, selfVote: true});
    }
    return tagRel.data;
  } else {
    // Upvote the tag
    const { performVoteServer } = require("../voteServer");
    const {modifiedDocument: votedTagRel} = await performVoteServer({
      document: existingTagRel,
      voteType: 'smallUpvote',
      collection: TagRels,
      user: currentUser,
      toggleIfAlreadyVoted: false,
      skipRateLimits: true,
      selfVote
    });
    // performVoteServer should be generic but it ain't, and returns a DbVoteableType
    return votedTagRel as DbTagRel;
  }
}

export const tagsGqlTypeDefs = gql`
  extend type Mutation {
    addOrUpvoteTag(tagId: String, postId: String): TagRel
    addTags(postId: String, tagIds: [String]): Boolean
  }
`

export const tagsGqlMutations = {
  addOrUpvoteTag: async (root: void, {tagId, postId}: {tagId: string, postId: string}, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser) throw new Error("You must be logged in to tag");
    if (!postId) throw new Error("Missing argument: postId");
    if (!tagId) throw new Error("Missing argument: tagId");
    
    return addOrUpvoteTag({tagId, postId, currentUser, context});
  },
  
  addTags: async (root: void, {postId, tagIds}: {postId: string, tagIds: Array<string>}, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser) throw new Error("You must be logged in to tag");
    if (!postId) throw new Error("Missing argument: postId");
    if (!tagIds) throw new Error("Missing argument: tagIds");
    
    await Promise.all(tagIds.map(tagId =>
      addOrUpvoteTag({ tagId, postId, currentUser, context })
    ));
    
    return true;
  },
}
