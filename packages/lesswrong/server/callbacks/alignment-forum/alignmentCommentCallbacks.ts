import { Posts } from "../../../lib/collections/posts";
import { Comments } from '../../../lib/collections/comments'
import { updateMutator } from '../../vulcan-lib';
import { commentsAlignmentAsync } from '../../resolvers/alignmentForumMutations';
import { getCollectionHooks } from '../../mutationCallbacks';
import * as _ from 'underscore';

export function recalculateAFCommentMetadata(postId: string|null) {
  if (!postId)
    return;
  
  const afComments = Comments.find({
    postId:postId,
    af: true,
    deleted: false
  }).fetch()

  const lastComment:DbComment = _.max(afComments, function(c){return c.postedAt;})
  const lastCommentedAt = (lastComment && lastComment.postedAt) || Posts.findOne({_id:postId})?.postedAt || new Date()

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

function ModerateCommentsPostUpdate (comment: DbComment, oldComment: DbComment) {
  recalculateAFCommentMetadata(comment.postId)
}
commentsAlignmentAsync.add(ModerateCommentsPostUpdate);


getCollectionHooks("Comments").newAsync.add(function AlignmentCommentsNewOperations (comment: DbComment) {
  if (comment.af) {
    recalculateAFCommentMetadata(comment.postId)
  }
});

//TODO: Probably change these to take a boolean argument?
const updateParentsSetAFtrue = (comment: DbComment) => {
  Comments.update({_id:comment.parentCommentId}, {$set: {af: true}});
  const parent = Comments.findOne({_id: comment.parentCommentId});
  if (parent) {
    updateParentsSetAFtrue(parent)
  }
}

const updateChildrenSetAFfalse = (comment: DbComment) => {
  const children = Comments.find({parentCommentId: comment._id}).fetch();
  children.forEach((child)=> {
    Comments.update({_id:child._id}, {$set: {af: false}});
    updateChildrenSetAFfalse(child)
  })
}

function CommentsAlignmentEdit (comment: DbComment, oldComment: DbComment) {
  if (comment.af && !oldComment.af) {
    updateParentsSetAFtrue(comment);
    recalculateAFCommentMetadata(comment.postId)
  }
  if (!comment.af && oldComment.af) {
    updateChildrenSetAFfalse(comment);
    recalculateAFCommentMetadata(comment.postId)
  }
}
getCollectionHooks("Comments").editAsync.add(CommentsAlignmentEdit);
commentsAlignmentAsync.add(CommentsAlignmentEdit);


getCollectionHooks("Comments").newAsync.add(function CommentsAlignmentNew (comment: DbComment) {
  if (comment.af) {
    updateParentsSetAFtrue(comment);
    recalculateAFCommentMetadata(comment.postId)
  }
});
