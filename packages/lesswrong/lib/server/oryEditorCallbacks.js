
// onInsert: (document) => {
//   const ContentRenderer = (props) => getDynamicComponent(import('packages/lesswrong/components/async/ContentRenderer.jsx'), props);
//   if (document.description) {
//     return ReactDOMServer.renderToStaticMarkup(<ContentRenderer state={document.description} />);
//   } else {
//     return document.htmlDescription;
//   }
// },
// onEdit: (modifier, document) => {
//   const ContentRenderer = (props) => getDynamicComponent(import('packages/lesswrong/components/async/ContentRenderer.jsx'), props);
//   if (modifier.$set.description) {
//     return ReactDOMServer.renderToStaticMarkup(<ContentRenderer state={modifier.$set.description} />)
//   }
// },

import React from 'react'
import { Components, getDynamicComponent } from 'meteor/vulcan:core'
import { addCallback } from 'meteor/vulcan:core';
import { Posts, Comments } from 'meteor/example-forum';
import Messages from '../collections/messages/collection.js';
import Chapters from '../collections/chapters/collection.js';
import Sequences from '../collections/sequences/collection.js';
import Books from '../collections/books/collection.js';
import Collections from '../collections/collections/collection.js';
import htmlToText from 'html-to-text';
import ReactDOMServer from 'react-dom/server';
import oryToHtml from './utils.js';

function postsNewHTMLBodyAndPlaintextBody(post) {
  if (post.content) {
    const html = oryToHtml(post.content);
    const plaintextBody = htmlToText.fromString(html);
    const excerpt =  plaintextBody.slice(0,140);
    Posts.update(post._id, {$set: {htmlBody: html, body: plaintextBody, excerpt: excerpt}});
  } else if (post.htmlBody) {
    const html = post.htmlBody;
    const plaintextBody = htmlToText.fromString(html);
    const excerpt = plaintextBody.slice(0,140);
    Posts.update(post._id, {$set: {body: plaintextBody, excerpt: excerpt, htmlBody: html}});
  }
}

addCallback("posts.new.async", postsNewHTMLBodyAndPlaintextBody);
addCallback("posts.edit.async", postsNewHTMLBodyAndPlaintextBody);

function commentsNewHTMLBodyAndPlaintextBody(comment) {
  if (comment.content) {
    const html = oryToHtml(comment.content);
    const plaintextBody = htmlToText.fromString(html);
    const excerpt = plaintextBody.slice(0,200);
    Comments.update(comment._id, {$set: {htmlBody: html, body: plaintextBody, excerpt: excerpt}});
  } else if (comment.htmlBody){
    const html = comment.htmlBody;
    const plaintextBody = htmlToText.fromString(html);
    const excerpt = plaintextBody.slice(0,200);
    Comments.update(comment._id, {$set: {body: plaintextBody, excerpt: excerpt}});
  }
}

addCallback("comments.new.async", commentsNewHTMLBodyAndPlaintextBody);
addCallback("comments.edit.async", commentsNewHTMLBodyAndPlaintextBody);

function sequencesNewHTMLAndPlaintextDescription(sequence) {
  if (sequence.description) {
    const html = oryToHtml(sequence.description);
    const plaintextBody = htmlToText.fromString(html);
    Sequences.update(sequence._id, {$set: {plaintextDescription: plaintextBody, htmlDescription: html}});
  }
}

addCallback("sequences.new.async", sequencesNewHTMLAndPlaintextDescription);
addCallback("sequences.edit.async", sequencesNewHTMLAndPlaintextDescription);

function chaptersNewHTMLDescription(chapter) {
  if (chapter.description) {
    const html = oryToHtml(chapter.description);
    Chapters.update(chapter._id, {$set: {htmlDescription: html}});
  }
}

addCallback("chapters.new.async", chaptersNewHTMLDescription);
addCallback("chapters.edit.async", chaptersNewHTMLDescription);

function booksNewHTMLDescription(book) {
  if (book.description) {
    const html = oryToHtml(book.description);
    Books.update(book._id, {$set: {htmlDescription: html}});
  }
}

addCallback("books.new.async", booksNewHTMLDescription);
addCallback("books.edit.async", booksNewHTMLDescription);

function collectionsNewHTMLDescription(collection) {
  if (collection.description) {
    const html = oryToHtml(collection.description);
    Collections.update(collection._id, {$set: {htmlDescription: html}});
  }
}

addCallback("collections.new.async", collectionsNewHTMLDescription);
addCallback("collections.edit.async", collectionsNewHTMLDescription);

function messagesNewHTMLBody(message) {
  if (message.content) {
    const html = oryToHtml(message.content);
    Messages.update(message._id, {$set: {htmlBody: html}});
  }
}

addCallback("messages.new.async", messagesNewHTMLBody);
addCallback("messages.edit.async", messagesNewHTMLBody);
