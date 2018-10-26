import { Posts } from "../../../collections/posts";
import { Comments } from '../../../collections/comments'
import { addCallback, editMutation } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";

function ModerateCommentsPostUpdate (comment, oldComment) {
  const afComments = Comments.find({
    postId:comment.postId,
    af: true,
    deleted: {$ne: true}
  }).fetch()

  const lastComment = _.max(afComments, function(c){return c.postedAt;})
  const lastCommentedAt = (lastComment && lastComment.postedAt) || Posts.findOne({_id:comment.postId}).postedAt

  editMutation({
    collection:Posts,
    documentId: comment.postId,
    set: {
      afLastCommentedAt:new Date(lastCommentedAt),
      afCommentCount:afComments.length
    },
    unset: {}
  })
}
addCallback("comments.moderate.async", ModerateCommentsPostUpdate);
addCallback("comments.alignment.async", ModerateCommentsPostUpdate);


function AlignmentCommentsNewOperations (comment) {
  if (comment.af) {
    const afComments = Comments.find({
      postId:comment.postId,
      af: true,
      deleted: {$ne: true}
    }).fetch()

    // update post
    Posts.update(comment.postId, {
      $set: {
        afLastCommentedAt: new Date(),
        afCommentCount: afComments.length
      },
    });
  }
}
addCallback('comments.new.async', AlignmentCommentsNewOperations);

async function CommentsMoveToAFUpdatesAFPostCount (comment) {
  const afCommentCount = Comments.find({userId:comment.userId, af: true}).count()
  Users.update({_id:comment.userId}, {$set: {afCommentCount: afCommentCount}})
}

addCallback("comments.alignment.async", CommentsMoveToAFUpdatesAFPostCount);
addCallback("comments.edit.async", CommentsMoveToAFUpdatesAFPostCount);
addCallback("comments.new.async", CommentsMoveToAFUpdatesAFPostCount);
