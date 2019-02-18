import { addCallback } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import Sequences from '../../lib/collections/sequences/collection.js';
import { algoliaDocumentExport } from './utils.js';

const commentIndexName = 'test_comments';
const postIndexName = 'test_posts';
const userIndexName = 'test_users';
const sequenceIndexName = 'test_sequences';

function newCommentAlgoliaIndex(comment) {
  algoliaDocumentExport({
    documents: [comment],
    collection: Comments,
    indexName: commentIndexName,
    exportFunction: Comments.toAlgolia,
    updateFunction: (comment) => Comments.update(comment._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("comments.new.async", newCommentAlgoliaIndex)

function editCommentAlgoliaIndex(comment) {
  algoliaDocumentExport({
    documents: [comment],
    collection: Comments,
    indexName: commentIndexName,
    exportFunction: Comments.toAlgolia,
    updateFunction: (comment) => Comments.update(comment._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("comments.edit.async", editCommentAlgoliaIndex)

function newPostAlgoliaIndex(post) {
  if (!post.draft) {
    algoliaDocumentExport({
      documents: [post],
      collection: Posts,
      indexName: postIndexName,
      exportFunction: Posts.toAlgolia,
      updateFunction: (post) => Posts.update(post._id, {$set: {algoliaIndexAt: new Date()}})
    })
  }
}
addCallback("posts.new.async", newPostAlgoliaIndex)

function editPostAlgoliaIndex(post) {
  if (!post.draft) {
    algoliaDocumentExport({
      documents: [post],
      collection: Posts,
      indexName: postIndexName,
      exportFunction: Posts.toAlgolia,
      updateFunction: (post) => Posts.update(post._id, {$set: {algoliaIndexAt: new Date()}})
    })
  }
}
addCallback("posts.edit.async", editPostAlgoliaIndex)

function newUserAlgoliaIndex(user) {
  algoliaDocumentExport({
    documents: [user],
    collection: Users,
    indexName: userIndexName,
    exportFunction: Users.toAlgolia,
    updateFunction: (user) => Users.update(user._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("users.new.async", newUserAlgoliaIndex)

function editUserAlgoliaIndex(user) {
  algoliaDocumentExport({
    documents: [user],
    collection: Users,
    indexName: userIndexName,
    exportFunction: Users.toAlgolia,
    updateFunction: (user) => Users.update(user._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("users.edit.async", editUserAlgoliaIndex)

function newSequenceAlgoliaIndex(sequence) {
  algoliaDocumentExport({
    documents: [sequence],
    collection: Sequences,
    indexName: sequenceIndexName,
    exportFunction: Sequences.toAlgolia,
    updateFunction: (sequence) => Sequences.update(sequence._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("sequences.new.async", newSequenceAlgoliaIndex)

function editSequenceAlgoliaIndex(sequence) {
  algoliaDocumentExport({
    documents: [sequence],
    collection: Sequences,
    indexName: sequenceIndexName,
    exportFunction: Sequences.toAlgolia,
    updateFunction: (sequence) => Sequences.update(sequence._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("sequences.edit.async", editSequenceAlgoliaIndex);
