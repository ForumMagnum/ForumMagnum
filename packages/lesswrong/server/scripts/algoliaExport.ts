import { Vulcan } from '../../lib/vulcan-lib';
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
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';
import moment from 'moment';
import { isProductionDBSetting } from '../../lib/publicSettings';

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
      await algoliaExport(Posts, {baseScore: {$gte: 0}, draft: {$ne: true}, status: postStatuses.STATUS_APPROVED})
      break
    case 'Comments':
      await algoliaExport(Comments, {baseScore: {$gt: 0}, deleted: {$ne: true}})
      break
    case 'Users':
      await algoliaExport(Users, {deleted: {$ne: true}})
      break
    case 'Sequences':
      await algoliaExport(Sequences)
      break
    case 'Tags':
      await algoliaExport(Tags, {deleted: {$ne: true}});
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


Vulcan.runAlgoliaExport = wrapVulcanAsyncScript('runAlgoliaExport', algoliaExportByCollectionName)
Vulcan.runAlgoliaExportAll = wrapVulcanAsyncScript('runAlgoliaExportAll', algoliaExportAll)
Vulcan.algoliaExportAll = wrapVulcanAsyncScript('algoliaExportAll', algoliaExportAll)


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
  console.log("Checking documents against the mongodb...");
  const ids = _.map(allDocuments, doc=>doc._id)
  const mongoIdsToDelete = await subsetOfIdsAlgoliaShouldntIndex(collection, ids); // TODO: Pagination
  const mongoIdsToDeleteDict = keyBy(mongoIdsToDelete, id=>id);
  
  const hitsToDelete = _.filter(allDocuments, doc=>doc._id in mongoIdsToDeleteDict);
  const algoliaIdsToDelete = _.map(hitsToDelete, hit=>hit.objectID);
  // eslint-disable-next-line no-console
  console.log(`Deleting ${mongoIdsToDelete.length} mongo IDs (${algoliaIdsToDelete.length} algolia IDs) from Algolia...`);
  await algoliaDeleteIds(algoliaIndex, algoliaIdsToDelete);
  // eslint-disable-next-line no-console
  console.log("Done.");
}

export async function algoliaCleanAll() {
  for (let collectionName of algoliaIndexedCollectionNames) {
    await algoliaCleanIndex(collectionName);
  }
}

Vulcan.algoliaCleanIndex = wrapVulcanAsyncScript('algoliaCleanIndex', algoliaCleanIndex);
Vulcan.algoliaCleanAll = wrapVulcanAsyncScript('algoliaCleanAll', algoliaCleanAll);

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

Vulcan.algoliaDestroyIndex = wrapVulcanAsyncScript('algoliaDestroyIndex', algoliaDestroyIndex)
Vulcan.algoliaDestroyAll = wrapVulcanAsyncScript('algoliaDestroyAll', algoliaDestroyAll)

/**
 * Destroy and rebuild algolia. (Probably) DO NOT RUN ON PRODUCTION!!
 *
 * Because this is dev, it'll only recreate the last few months of documents.
 */
async function algoliaDevRefresh() {
  await algoliaDestroyAll()
  await algoliaExportAll()
}

Vulcan.algoliaDevRefresh = wrapVulcanAsyncScript('algoliaDevRefresh', algoliaDevRefresh)
