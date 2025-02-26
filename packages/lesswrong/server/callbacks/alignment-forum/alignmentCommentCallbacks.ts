import { Posts } from "../../../lib/collections/posts/collection";
import { Comments } from '../../../lib/collections/comments/collection'
import { updateMutator } from '../../vulcan-lib/mutators';
import { getCommentAncestorIds, getCommentSubtree } from '../../utils/commentTreeUtils';
import * as _ from 'underscore';

export async function recalculateAFCommentMetadata(postId: string|null) {
  if (!postId)
    return;
  
  const afComments = await Comments.find({
    postId:postId,
    af: true,
    deleted: false
  }).fetch()

  const lastComment: DbComment = _.max(afComments, function(c){return c.postedAt;})
  const lastCommentedAt = (lastComment && lastComment.postedAt) || (await Posts.findOne({_id:postId}))?.postedAt || new Date()

  void updateMutator({
    collection:Posts,
    documentId: postId,
    set: {
      // Needs to be recomputed after anything moves to/from AF; can't be handled
      // incrementally by simpler callbacks because a comment being removed from
      // AF might mean an unrelated comment is now the newest.
      afLastCommentedAt:new Date(lastCommentedAt),
      // Needs to be recomputed after anything moves to/from AF because those
      // moves are using raw updates.
      afCommentCount: afComments.length,
    },
    unset: {},
    validate: false,
  })
}

// TODO: move this to a commentCallbackFunctions file.  This was a newAsync.
async function alignmentCommentsNewOperations(comment: DbComment) {
  if (comment.af) {
    await recalculateAFCommentMetadata(comment.postId)
  }
}

//TODO: Probably change these to take a boolean argument?
const updateParentsSetAFtrue = async (comment: DbComment) => {
  const ancestorIds = await getCommentAncestorIds(comment);
  if (ancestorIds.length > 0) {
    await Comments.rawUpdateMany({_id: {$in: ancestorIds}}, {$set: {af: true}});
  }
}

const updateChildrenSetAFfalse = async (comment: DbComment) => {
  const subtreeComments: DbComment[] = await getCommentSubtree(comment);
  if (subtreeComments.length > 0) {
    const subtreeCommentIds: string[] = subtreeComments.map(c=>c._id);
    await Comments.rawUpdateMany({_id: {$in: subtreeCommentIds}}, {$set: {af: false}});
  }
}

// TODO: move this to a commentCallbackFunctions file.  This was an editAsync.
export async function commentsAlignmentEdit(comment: DbComment, oldComment: DbComment) {
  if (comment.af && !oldComment.af) {
    await updateParentsSetAFtrue(comment);
    await recalculateAFCommentMetadata(comment.postId)
  }
  if (!comment.af && oldComment.af) {
    await updateChildrenSetAFfalse(comment);
    await recalculateAFCommentMetadata(comment.postId)
  }
}

// TODO: move this to a commentCallbackFunctions file.  This was a newAsync.
async function commentsAlignmentNew(comment: DbComment) {
  if (comment.af) {
    await updateParentsSetAFtrue(comment);
    await recalculateAFCommentMetadata(comment.postId)
  }
}
