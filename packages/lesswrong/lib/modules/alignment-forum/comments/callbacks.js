import { Posts } from "../../../collections/posts";
import { Comments } from '../../../collections/comments'
import { addCallback, editMutation } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";

function recalculateAFCommentMetadata(postId) {
  const afComments = Comments.find({
    postId:postId,
    af: true,
    deleted: false
  }).fetch()

  const lastComment = _.max(afComments, function(c){return c.postedAt;})
  const lastCommentedAt = (lastComment && lastComment.postedAt) || Posts.findOne({_id:postId}).postedAt

  editMutation({
    collection:Posts,
    documentId: postId,
    set: {
      afLastCommentedAt:new Date(lastCommentedAt),
      afCommentCount:afComments.length
    },
    unset: {},
    validate: false,
  })
}

function ModerateCommentsPostUpdate (comment, oldComment) {
  recalculateAFCommentMetadata(comment.postId)
}
addCallback("comments.moderate.async", ModerateCommentsPostUpdate);
addCallback("comments.alignment.async", ModerateCommentsPostUpdate);


function AlignmentCommentsNewOperations (comment) {
  if (comment.af) {
    recalculateAFCommentMetadata(comment.postId)
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

//TODO: Probably change these to take a boolean argument?
const updateParentsSetAFtrue = (comment) => {
  Comments.update({_id:comment.parentCommentId}, {$set: {af: true}});
  const parent = Comments.findOne({_id: comment.parentCommentId});
  if (parent) {
    updateParentsSetAFtrue(parent)
  }
}

const updateChildrenSetAFfalse = (comment) => {
  const children = Comments.find({parentCommentId: comment._id}).fetch();
  children.forEach((child)=> {
    Comments.update({_id:child._id}, {$set: {af: false}});
    updateChildrenSetAFfalse(child)
  })
}

function CommentsAlignmentEdit (comment, oldComment) {
  if (comment.af && !oldComment.af) {
    updateParentsSetAFtrue(comment);
    recalculateAFCommentMetadata(comment.postId)
  }
  if (!comment.af && oldComment.af) {
    updateChildrenSetAFfalse(comment);
    recalculateAFCommentMetadata(comment.postId)
  }
}
addCallback("comments.edit.async", CommentsAlignmentEdit);
addCallback("comments.alignment.async", CommentsAlignmentEdit);


function CommentsAlignmentNew (comment) {
  if (comment.af) {
    updateParentsSetAFtrue(comment);
    recalculateAFCommentMetadata(comment.postId)
  }
}
addCallback("comments.new.async", CommentsAlignmentNew);
