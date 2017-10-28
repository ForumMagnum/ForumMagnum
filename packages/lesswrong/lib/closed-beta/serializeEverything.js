import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Posts, Comments } from 'meteor/example-forum';
import { runCallbacksAsync, Components } from 'meteor/vulcan:core';
import Sequences from '../collections/sequences/collection.js';
import Chapters from '../collections/chapters/collection.js';
import Books from '../collections/books/collection.js';
import Collections from '../collections/collections/collection.js';

import htmlToText from 'html-to-text';

const runFix = true;

if (runFix) {
  console.log("Serializing everything in the db");
  Meteor.startup(function () {
    serializeSequenceLikes();
    serializePosts();
    serializeComments();
  });
}

function serializePosts() {
  Posts.find({content: {$exists: true}}).fetch().forEach((post) => {
    if (post.content) {
      runCallbacksAsync("posts.edit.async", post);
    }
  })
}

function serializeComments() {
  Comments.find({content: {$exists: true}}).fetch().forEach((comment) => {
    if (comment.content) {
      runCallbacksAsync("comments.edit.async", comment);
    }
  })
}

function serializeSequenceLike(item, collection) {
  if (item.description) {
    try {
      const htmlDescription = ReactDOMServer.renderToStaticMarkup(<Components.ContentRenderer state={item.description} />);
      const plaintextDescription = htmlToText.fromString(htmlDescription);
      collection.update({_id: item._id}, {$set: {htmlDescription, plaintextDescription}})
    } catch(e) {
      console.log("Invalid content object", item.description);
      console.log(e);
    }


  }

}

function serializeSequenceLikes() {
  Sequences.find({description: {$exists: true}}).fetch().forEach((sequence) => {
    serializeSequenceLike(sequence, Sequences);
  })
  Chapters.find({description: {$exists: true}}).fetch().forEach((chapter) => {
    serializeSequenceLike(chapter, Chapters);
  })
  Books.find({description: {$exists: true}}).fetch().forEach((book) => {
    serializeSequenceLike(book, Books);
  })
  Collections.find({description: {$exists: true}}).fetch().forEach((collection) => {
    serializeSequenceLike(collection, Collections);
  })
}
