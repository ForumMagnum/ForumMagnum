import React from 'react';
import { Comments } from "meteor/example-forum";
import { addCallback, editMutation, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import { convertToHTML, convertFromHTML } from 'draft-convert';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';

// function commentsSoftRemoveChildrenComments(comment) {
//     const childrenComments = Comments.find({parentCommentId: comment._id}).fetch();
//     childrenComments.forEach(childComment => {
//       editMutation({
//         documentId: childComment._id,
//         set: {deleted:true},
//         unset: {}
//       }).then(()=>console.log('comment softRemoved')).catch(/* error */);
//     });
// }


function CommentsEditSoftDeleteCallback (comment, oldComment) {
  if (comment.deleted && !oldComment.deleted) {
    runCallbacksAsync('comments.softDelete.async', comment);
  }
}
addCallback("comments.edit.async", CommentsEditSoftDeleteCallback);

function CommentsNewHTMLSerializeCallback (comment) {
  if (comment.content) {
    const contentState = convertFromRaw(comment.content);
    const html = draftToHTML(contentState);
    comment.htmlBody = html;
    comment.body = contentState.getPlainText();
    console.log("Comments New HTML serialization", html)
  } else if (comment.htmlBody) {
    comment.body = htmlToText.fromString(comment.htmlBody);
  }
  return comment
}

addCallback("comments.new.sync", CommentsNewHTMLSerializeCallback);

function CommentsEditHTMLSerializeCallback (modifier, comment) {
  if (modifier.$set && modifier.$set.content) {
    const contentState = convertFromRaw(modifier.$set.content);
    console.log("Comment Edit callback: ", modifier.$set.content);
    modifier.$set.htmlBody = draftToHTML(contentState);
    modifier.$set.body = contentState.getPlainText();
    console.log("Comments Edit HTML serialization", modifier.$set.htmlBody, modifier.$set.plaintextBody)
  } else if (modifier.$set && modifier.$set.htmlBody) {
    modifier.$set.body = htmlToText.fromString(modifier.$set.htmlBody);
  }
  return modifier
}

addCallback("comments.edit.sync", CommentsEditHTMLSerializeCallback);

// function commentsNewHTMLBodyAndPlaintextBody(comment) {
//   if (comment.content) {
//     const html = ReactDOMServer.renderToStaticMarkup(<Components.ContentRenderer state={comment.content} />);
//     const plaintextBody = htmlToText.fromString(html);
//     Comments.update(comment._id, {$set: {htmlBody: html, body: plaintextBody}});
//   } else if (comment.htmlBody){
//     const html = comment.htmlBody;
//     const plaintextBody = htmlToText.fromString(html);
//     Comments.update(comment._id, {$set: {body: plaintextBody}});
//   }
// }
//
// addCallback("comments.new.async", commentsNewHTMLBodyAndPlaintextBody);
// addCallback("comments.edit.async", commentsNewHTMLBodyAndPlaintextBody);
