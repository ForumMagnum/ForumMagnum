import { Posts } from "../../../lib/collections/posts";
import { Comments } from '../../../lib/collections/comments'
import { updateMutator } from '../../vulcan-lib';
import { commentsAlignmentAsync } from '../../resolvers/alignmentForumMutations';
import { getCollectionHooks } from '../../mutationCallbacks';
import { asyncForeachSequential } from '../../../lib/utils/asyncUtils';
import * as _ from 'underscore';

export async function recalculateAFCommentMetadata(postId: string|null) {
  if (!postId)
    return;
  
  const afComments = await Comments.find({
    postId:postId,
    af: true,
    deleted: false
  }).fetch()

  const lastComment:DbComment = _.max(afComments, function(c){return c.postedAt;})
  const lastCommentedAt = (lastComment && lastComment.postedAt) || (await Posts.findOne({_id:postId}))?.postedAt || new Date()

  void updateMutator({
    collection:Posts,
    documentId: postId,
    set: {
      afLastCommentedAt:new Date(lastCommentedAt),
    },
    unset: {},
    validate: false,
  })
}

async function ModerateCommentsPostUpdate (comment: DbComment, oldComment: DbComment) {
  await recalculateAFCommentMetadata(comment.postId)
}
commentsAlignmentAsync.add(ModerateCommentsPostUpdate);


getCollectionHooks("Comments").newAsync.add(async function AlignmentCommentsNewOperations (comment: DbComment) {
  if (comment.af) {
    await recalculateAFCommentMetadata(comment.postId)
  }
});

//TODO: Probably change these to take a boolean argument?
const updateParentsSetAFtrue = async (comment: DbComment) => {
  await Comments.rawUpdateOne({_id:comment.parentCommentId}, {$set: {af: true}});
  const parent = await Comments.findOne({_id: comment.parentCommentId});
  if (parent) {
    await updateParentsSetAFtrue(parent)
  }
}

const updateChildrenSetAFfalse = async (comment: DbComment) => {
  const children = await Comments.find({parentCommentId: comment._id}).fetch();
  await asyncForeachSequential(children, async (child) => {
    await Comments.rawUpdateOne({_id:child._id}, {$set: {af: false}});
    await updateChildrenSetAFfalse(child)
  })
}

async function CommentsAlignmentEdit (comment: DbComment, oldComment: DbComment) {
  if (comment.af && !oldComment.af) {
    await updateParentsSetAFtrue(comment);
    await recalculateAFCommentMetadata(comment.postId)
  }
  if (!comment.af && oldComment.af) {
    await updateChildrenSetAFfalse(comment);
    await recalculateAFCommentMetadata(comment.postId)
  }
}
getCollectionHooks("Comments").editAsync.add(CommentsAlignmentEdit);
commentsAlignmentAsync.add(CommentsAlignmentEdit);


getCollectionHooks("Comments").newAsync.add(async function CommentsAlignmentNew (comment: DbComment) {
  if (comment.af) {
    await updateParentsSetAFtrue(comment);
    await recalculateAFCommentMetadata(comment.postId)
  }
});
