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

function commentAlgoliaIndex(comment) {
  algoliaDocumentExport({
    documents: [comment],
    collection: Comments,
    indexName: commentIndexName,
    exportFunction: Comments.toAlgolia,
    updateFunction: (comment) => Comments.update(comment._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("comments.new.async", commentAlgoliaIndex)
addCallback("comments.edit.async", commentAlgoliaIndex)

function postAlgoliaIndex(post) {
  if (post.draft) return null;
  
  algoliaDocumentExport({
    documents: [post],
    collection: Posts,
    indexName: postIndexName,
    exportFunction: Posts.toAlgolia,
    updateFunction: (post) => Posts.update(post._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("posts.new.async", postAlgoliaIndex)
addCallback("posts.edit.async", postAlgoliaIndex)

function userAlgoliaIndex(user) {
  algoliaDocumentExport({
    documents: [user],
    collection: Users,
    indexName: userIndexName,
    exportFunction: Users.toAlgolia,
    updateFunction: (user) => Users.update(user._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("users.new.async", userAlgoliaIndex)
addCallback("users.edit.async", userAlgoliaIndex)

function sequenceAlgoliaIndex(sequence) {
  algoliaDocumentExport({
    documents: [sequence],
    collection: Sequences,
    indexName: sequenceIndexName,
    exportFunction: Sequences.toAlgolia,
    updateFunction: (sequence) => Sequences.update(sequence._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("sequences.new.async", sequenceAlgoliaIndex)
addCallback("sequences.edit.async", sequenceAlgoliaIndex);
