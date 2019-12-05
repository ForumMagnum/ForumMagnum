import { addCallback } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import { Tags } from '../../lib/collections/tags/collection.js'
import Users from 'meteor/vulcan:users';
import Sequences from '../../lib/collections/sequences/collection.js';
import { algoliaDocumentExport } from './utils.js';


async function commentAlgoliaIndex(comment) {
  await algoliaDocumentExport({
    documents: [comment],
    collection: Comments,
  })
}
addCallback("comments.new.async", commentAlgoliaIndex)
addCallback("comments.edit.async", commentAlgoliaIndex)

async function postAlgoliaIndex(post) {
  await algoliaDocumentExport({
    documents: [post],
    collection: Posts,
  })
}
addCallback("posts.new.async", postAlgoliaIndex)
addCallback("posts.edit.async", postAlgoliaIndex)

async function userAlgoliaIndex(user) {
  await algoliaDocumentExport({
    documents: [user],
    collection: Users,
  })
}
addCallback("users.new.async", userAlgoliaIndex)
addCallback("users.edit.async", userAlgoliaIndex)

async function sequenceAlgoliaIndex(sequence) {
  await algoliaDocumentExport({
    documents: [sequence],
    collection: Sequences,
  })
}
addCallback("sequences.new.async", sequenceAlgoliaIndex)
addCallback("sequences.edit.async", sequenceAlgoliaIndex);

async function tagAlgoliaIndex(tag) {
  await algoliaDocumentExport({
    documents: [tag],
    collection: Tags,
  })
}
addCallback("tags.new.async", tagAlgoliaIndex)
addCallback("tags.edit.async", tagAlgoliaIndex);
