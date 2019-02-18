import { addCallback } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import Sequences from '../../lib/collections/sequences/collection.js';
import { algoliaDocumentExport } from './utils.js';


async function commentAlgoliaIndex(comment) {
  await algoliaDocumentExport({
    documents: [comment],
    collection: Comments,
    updateFunction: (comment) => Comments.update(comment._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("comments.new.async", commentAlgoliaIndex)
addCallback("comments.edit.async", commentAlgoliaIndex)

async function postAlgoliaIndex(post) {
  if (post.draft) return null;
  
  await algoliaDocumentExport({
    documents: [post],
    collection: Posts,
    updateFunction: (post) => Posts.update(post._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("posts.new.async", postAlgoliaIndex)
addCallback("posts.edit.async", postAlgoliaIndex)

async function userAlgoliaIndex(user) {
  await algoliaDocumentExport({
    documents: [user],
    collection: Users,
    updateFunction: (user) => Users.update(user._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("users.new.async", userAlgoliaIndex)
addCallback("users.edit.async", userAlgoliaIndex)

async function sequenceAlgoliaIndex(sequence) {
  await algoliaDocumentExport({
    documents: [sequence],
    collection: Sequences,
    updateFunction: (sequence) => Sequences.update(sequence._id, {$set: {algoliaIndexAt: new Date()}})
  })
}
addCallback("sequences.new.async", sequenceAlgoliaIndex)
addCallback("sequences.edit.async", sequenceAlgoliaIndex);
