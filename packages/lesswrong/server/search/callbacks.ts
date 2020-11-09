import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import { Tags } from '../../lib/collections/tags/collection'
import Users from '../../lib/collections/users/collection';
import Sequences from '../../lib/collections/sequences/collection';
import { algoliaDocumentExport, AlgoliaIndexedDbObject } from './utils';
import { getCollectionHooks } from '../mutationCallbacks';


async function commentAlgoliaIndex(comment: DbComment) {
  await algoliaDocumentExport({
    documents: [comment],
    collection: Comments,
  })
}
getCollectionHooks("Comments").newAsync.add(commentAlgoliaIndex);
getCollectionHooks("Comments").editAsync.add(commentAlgoliaIndex);

async function postAlgoliaIndex(post: DbPost) {
  await algoliaDocumentExport({
    documents: [post],
    collection: Posts,
  })
}
getCollectionHooks("Posts").newAsync.add(postAlgoliaIndex);
getCollectionHooks("Posts").editAsync.add(postAlgoliaIndex);

async function userAlgoliaIndex(user: DbUser) {
  await algoliaDocumentExport({
    documents: [user],
    collection: Users,
  })
}
getCollectionHooks("Users").newAsync.add(userAlgoliaIndex);
getCollectionHooks("Users").editAsync.add(userAlgoliaIndex);

async function sequenceAlgoliaIndex(sequence: DbSequence) {
  await algoliaDocumentExport({
    documents: [sequence],
    collection: Sequences,
  })
}
getCollectionHooks("Sequences").newAsync.add(sequenceAlgoliaIndex);
getCollectionHooks("Sequences").editAsync.add(sequenceAlgoliaIndex);;

async function tagAlgoliaIndex(tag: DbTag) {
  await algoliaDocumentExport({
    documents: [tag],
    collection: Tags,
  })
}
getCollectionHooks("Tags").newAsync.add(tagAlgoliaIndex);
getCollectionHooks("Tags").editAsync.add(tagAlgoliaIndex);;
