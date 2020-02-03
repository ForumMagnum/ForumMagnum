import { addCallback } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import { Tags } from '../../lib/collections/tags/collection'
import Users from '../../lib/collections/users/collection';
import Sequences from '../../lib/collections/sequences/collection';
import { algoliaDocumentExport } from './utils';


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
