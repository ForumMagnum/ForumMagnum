import React from 'react';
import { Comments } from "meteor/example-forum";
import { addCallback, editMutation, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import { convertToHTML, convertFromHTML } from 'draft-convert';
import { convertFromRaw } from 'draft-js';


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

const draftToHTML = convertToHTML({
  entityToHTML: (entity, originalText) => {
    if (entity.type === 'image') {
      let classNames = 'draft-image '
      if (entity.data.alignment) {
        classNames = classNames + entity.data.alignment;
      }
      let style = ""
      if (entity.data.width) {
        style = "width:" + entity.data.width + "%";
      }
      return `<figure><img src="${entity.data.src}" class="${classNames}" style="${style}" /></figure>`;
    }
    if (entity.type === 'LINK') {
      return <a href={entity.data.url}>{originalText}</a>;
    }
    return originalText;
  },
  blockToHTML: (block) => {
     const type = block.type;
     if (type === 'atomic') {
       return {start: '<span>', end: '</span>'};
     }
     if (type === 'blockquote') {
       return <blockquote />
     }
    //  return <span/>;
   },
});




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
    console.log("Comments New HTML serialization", html)
  }
  return comment
}

addCallback("comments.new.sync", CommentsNewHTMLSerializeCallback);

function CommentsEditHTMLSerializeCallback (modifier, comment) {
  if (modifier.$set && modifier.$set.content) {
    const contentState = convertFromRaw(modifier.$set.content);
    console.log("Comment Edit callback: ", modifier.$set.content);
    modifier.$set.htmlBody = draftToHTML(contentState);
    modifier.$set.plaintextBody = contentState.getPlainText();
    console.log("Comments Edit HTML serialization", modifier.$set.htmlBody, modifier.$set.plaintextBody)
  } else if (modifier.$set && modifier.$set.htmlBody) {
    const contentState = convertFromRaw(modifier.$set.content);
    modifier.$set.plaintextBody = contentState.getPlainText();
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
