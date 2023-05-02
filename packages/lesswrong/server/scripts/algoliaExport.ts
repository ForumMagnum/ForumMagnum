import { Globals } from '../../lib/vulcan-lib/config';
import { Posts } from '../../lib/collections/posts'
import { postStatuses } from '../../lib/collections/posts/constants';
import { Comments } from '../../lib/collections/comments'
import { Tags } from '../../lib/collections/tags/collection'
import Users from '../../lib/collections/users/collection'
import { getCollection } from '../vulcan-lib';
import Sequences from '../../lib/collections/sequences/collection'
import { wrapVulcanAsyncScript } from './utils'
import { getAlgoliaAdminClient, algoliaIndexDocumentBatch, algoliaDeleteIds, subsetOfIdsAlgoliaShouldntIndex, algoliaGetAllDocuments, AlgoliaIndexedCollection, AlgoliaIndexedDbObject } from '../search/utils';
import { forEachDocumentBatchInCollection } from '../manualMigrations/migrationUtils';
import keyBy from 'lodash/keyBy';
import { getAlgoliaIndexName, algoliaIndexedCollectionNames, AlgoliaIndexCollectionName } from '../../lib/algoliaUtil';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { isProductionDBSetting } from '../../lib/publicSettings';
import * as _ from 'underscore';
import moment from 'moment';
import take from 'lodash/take';

async function algoliaExport(collection: AlgoliaIndexedCollection<AlgoliaIndexedDbObject>, selector?: {[attr: string]: any}, updateFunction?: any) {
  let client = getAlgoliaAdminClient();
  if (!client) return;
  
  // The EA Forum needs to use less algolia resources on Dev and Staging, so we
  // time-bound our queries
  const timeBound = forumTypeSetting.get() === 'EAForum' && !isProductionDBSetting.get() ?
    { createdAt: { $gte: moment().subtract(3, 'months').toDate() } } :
    {}
  const computedSelector = {...selector, ...timeBound}
  
  const indexName = getAlgoliaIndexName(collection.collectionName);
  // eslint-disable-next-line no-console
  console.log(`Exporting ${indexName}...`)
  let algoliaIndex = client.initIndex(indexName)
  
  // eslint-disable-next-line no-console
  console.log("Initiated Index connection")
  
  let totalErrors: any[] = [];
  const totalItems = await collection.find(computedSelector).count();
  let exportedSoFar = 0;
  
  await forEachDocumentBatchInCollection({
    collection,
    filter: computedSelector,
    batchSize: 100,
    loadFactor: 0.5,
    callback: async (documents: AlgoliaIndexedDbObject[]) => {
      await algoliaIndexDocumentBatch({ documents, collection, algoliaIndex, errors: totalErrors, updateFunction });
      
      exportedSoFar += documents.length;
      // eslint-disable-next-line no-console
      console.log(`Exported ${exportedSoFar}/${totalItems} entries to Algolia`);
    }
  });
  
  if (totalErrors.length) {
    // eslint-disable-next-line no-console
    console.log(`${collection.collectionName} indexing encountered the following errors:`, totalErrors)
  } else {
    // eslint-disable-next-line no-console
    console.log('No errors found when indexing', collection.collectionName)
  }
}

async function algoliaExportByCollectionName(collectionName: AlgoliaIndexCollectionName) {
  switch (collectionName) {
    case 'Posts':
      await algoliaExport(Posts, {baseScore: {$gte: 0}, draft: {$ne: true}, status: postStatuses.STATUS_APPROVED, rejected: {$ne :true}, authorIsUnreviewed: {$ne: true}})
      break
    case 'Comments':
      await algoliaExport(Comments, {baseScore: {$gt: 0}, deleted: {$ne: true}, rejected: {$ne: true}, authorIsUnreviewed: {$ne: true}})
      break
    case 'Users':
      await algoliaExport(Users, {deleted: {$ne: true}, deleteContent: {$ne: true}})
      break
    case 'Sequences':
      await algoliaExport(Sequences, {isDeleted: {$ne: true}, draft: {$ne: true}, hidden: {$ne: true}})
      break
    case 'Tags':
      await algoliaExport(Tags, {deleted: {$ne: true}, adminOnly: {$ne: true}});
      break;
    default:
      throw new Error(`Did not recognize collectionName: ${collectionName}`)
  }
}

export async function algoliaExportAll() {
  for (let collectionName of algoliaIndexedCollectionNames) {
    await algoliaExportByCollectionName(collectionName);
  }
}


Globals.runAlgoliaExport = wrapVulcanAsyncScript('runAlgoliaExport', algoliaExportByCollectionName)
Globals.runAlgoliaExportAll = wrapVulcanAsyncScript('runAlgoliaExportAll', algoliaExportAll)
Globals.algoliaExportAll = wrapVulcanAsyncScript('algoliaExportAll', algoliaExportAll)


// Go through the Algolia index for a collection, removing any documents which
// don't exist in mongodb or which exist but shouldn't be indexed. This plus
// algoliaExport together should result in a fully up to date Algolia index,
// regardless of the starting state.
async function algoliaCleanIndex(collectionName: AlgoliaIndexCollectionName)
{
  let client = getAlgoliaAdminClient();
  if (!client) return;
  
  const collection = getCollection(collectionName) as AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;
  if (!collection) throw new Error(`Invalid collection name '${collectionName}'`);
  
  // eslint-disable-next-line no-console
  console.log(`Deleting spurious documents from Algolia index ${getAlgoliaIndexName(collectionName)} for ${collectionName}`);
  let algoliaIndex = client.initIndex(getAlgoliaIndexName(collectionName));
  
  // eslint-disable-next-line no-console
  console.log("Downloading the full index...");
  let allDocuments = await algoliaGetAllDocuments(algoliaIndex);
  // eslint-disable-next-line no-console
  console.log(`Retrieved ${allDocuments.length} documents from the Algolia index`);
  
  // eslint-disable-next-line no-console
  console.log("Checking documents against the mongodb...");
  const ids = _.map(allDocuments, doc=>doc._id)
  const mongoIdsToDelete = await subsetOfIdsAlgoliaShouldntIndex(collection, ids); // TODO: Pagination
  const mongoIdsToDeleteDict = keyBy(mongoIdsToDelete, id=>id);
  
  const hitsToDelete = _.filter(allDocuments, doc=>doc._id in mongoIdsToDeleteDict);
  const algoliaIdsToDelete = _.map(hitsToDelete, hit=>hit.objectID);
  // eslint-disable-next-line no-console
  console.log(`Deleting ${mongoIdsToDelete.length} mongo IDs (${algoliaIdsToDelete.length} algolia IDs) from Algolia...`);
  // eslint-disable-next-line no-console
  console.log(`Sample IDs: ${take(mongoIdsToDelete, 5)}`);
  await algoliaDeleteIds(algoliaIndex, algoliaIdsToDelete);
  // eslint-disable-next-line no-console
  console.log("Done.");
}

export async function algoliaCleanAll() {
  for (let collectionName of algoliaIndexedCollectionNames) {
    await algoliaCleanIndex(collectionName);
  }
}

Globals.algoliaCleanIndex = wrapVulcanAsyncScript('algoliaCleanIndex', algoliaCleanIndex);
Globals.algoliaCleanAll = wrapVulcanAsyncScript('algoliaCleanAll', algoliaCleanAll);

/**
 * Remove all objects from the index
 *
 * Not called "clearIndex" following Algolia, because this is extremely
 * destructive. But it does not actually remove the index, just clears it.
 */
async function algoliaDestroyIndex(collectionName: AlgoliaIndexCollectionName) {
  // eslint-disable-next-line no-console
  console.log('Destroying index:', collectionName)
  const client = getAlgoliaAdminClient()
  if (!client) return
  const algoliaIndex = client.initIndex(getAlgoliaIndexName(collectionName))

  await algoliaIndex.clearIndex()
}

/** Remove all objects from algolia */
async function algoliaDestroyAll() {
  for (let collectionName of algoliaIndexedCollectionNames) {
    await algoliaDestroyIndex(collectionName)
  }
}

Globals.algoliaDestroyIndex = wrapVulcanAsyncScript('algoliaDestroyIndex', algoliaDestroyIndex)
Globals.algoliaDestroyAll = wrapVulcanAsyncScript('algoliaDestroyAll', algoliaDestroyAll)

/**
 * Destroy and rebuild algolia. (Probably) DO NOT RUN ON PRODUCTION!!
 *
 * Because this is dev, it'll only recreate the last few months of documents.
 */
async function algoliaDevRefresh() {
  await algoliaDestroyAll()
  await algoliaExportAll()
}

Globals.algoliaDevRefresh = wrapVulcanAsyncScript('algoliaDevRefresh', algoliaDevRefresh)

Globals.objectToAlgolia = wrapVulcanAsyncScript('objectToAlgolia', async (collectionName: CollectionNameString, id: string) => {
  const collection = getCollection(collectionName) as AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;
  if (!collection) {
    throw new Error(`Invalid collection name: ${collectionName}`);
  }
  if (!collection.toAlgolia) {
    throw new Error(`Collection is not Algolia-indexed: ${collectionName}`);
  }
  
  const obj = await collection.findOne(id);
  if (!obj) {
    throw new Error(`Object not found: ${collectionName}.${id}`);
  }
  
  const algoliaEntry = await collection.toAlgolia(obj);
  return algoliaEntry;
});
