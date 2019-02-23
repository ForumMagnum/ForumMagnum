/* global Vulcan */
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users'
import Sequences from '../../lib/collections/sequences/collection.js'
import { wrapVulcanAsyncScript } from './utils'
import { getAlgoliaAdminClient, algoliaIndexDocumentBatch, algoliaDeleteIds, algoliaDoSearch, subsetOfIdsAlgoliaShouldntIndex } from '../search/utils';
import { forEachDocumentBatchInCollection } from '../queryUtil';
import keyBy from 'lodash/keyBy';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames';

const indexedCollections = [ Posts, Users, Sequences, Comments ];

async function algoliaExport(collection, selector = {}, updateFunction) {
  let client = getAlgoliaAdminClient();
  if (!client) return;
  
  const indexName = algoliaIndexNames[collection.collectionName];
  // eslint-disable-next-line no-console
  console.log(`Exporting ${indexName}...`)
  let algoliaIndex = client.initIndex(indexName)
  
  // eslint-disable-next-line no-console
  console.log("Initiated Index connection")
  
  const totalErrors = [];
  const totalItems = collection.find(selector).count();
  let exportedSoFar = 0;
  
  await forEachDocumentBatchInCollection({collection, batchSize: 100, callback: async (documents) => {
    await algoliaIndexDocumentBatch({ documents, collection, algoliaIndex,
      errors: totalErrors, updateFunction });
    
    exportedSoFar += documents.length;
    // eslint-disable-next-line no-console
    console.log(`Exported ${exportedSoFar}/${totalItems} entries to Algolia`);
  }});
  
  if (totalErrors.length) {
    // eslint-disable-next-line no-console
    console.log(`${collection._name} indexing encountered the following errors:`, totalErrors)
  } else {
    // eslint-disable-next-line no-console
    console.log('No errors found when indexing', collection._name)
  }
}

async function algoliaExportByCollectionName(collectionName) {
  switch (collectionName) {
    case 'Posts':
      await algoliaExport(Posts, {baseScore: {$gte: 0}, draft: {$ne: true}, status: 2})
      break
    case 'Comments':
      await algoliaExport(Comments, {baseScore: {$gt: 0}, isDeleted: {$ne: true}})
      break
    case 'Users':
      await algoliaExport(Users, {deleted: {$ne: true}})
      break
    case 'Sequences':
      await algoliaExport(Sequences)
      break
    default:
      throw new Error(`Did not recognize collectionName: ${collectionName}`)
  }
}

export async function algoliaExportAll() {
  for (let collection of indexedCollections)
    await algoliaExportByCollectionName(collection.collectionName);
}


Vulcan.runAlgoliaExport = wrapVulcanAsyncScript('runAlgoliaExport', algoliaExportByCollectionName)
Vulcan.runAlgoliaExportAll = wrapVulcanAsyncScript('runAlgoliaExportAll', algoliaExportAll)
Vulcan.algoliaExportAll = algoliaExportAll


// Go through the Algolia index for a collection, removing any documents which
// don't exist in mongodb or which exist but shouldn't be indexed. This plus
// algoliaExport together should result in a fully up to date Algolia index,
// regardless of the starting state.
async function algoliaCleanIndex(collection)
{
  let client = getAlgoliaAdminClient();
  if (!client) return;
  
  // eslint-disable-next-line no-console
  console.log(`Deleting spurious documents from Algolia index for ${collection.collectionName}`);
  let algoliaIndex = client.initIndex(algoliaIndexNames[collection.collectionName]);
  
  let currentPage = 0;
  let pageResults;
  do {
    // FIXME: If rows actually get deleted, then this shifts the pagination
    // boundaries, so deleting n documents means skipping the check on the
    // first n results on the next page.
    // Unfortunately we can't just naively skip advancing the page whenever
    // something is deleted, because that has the potential to be
    // catastrophically slow; if the index consists of (pagesize-1) valid
    // documents followed by many invalid documents, then we handle the invalid
    // documents only one at a time.
    pageResults = await algoliaDoSearch(algoliaIndex, {
      query: "",
      attributesToRetrieve: ['objectID', '_id'],
      hitsPerPage: 1000,
      page: currentPage,
    });
    currentPage++;
    
    const ids = _.map(pageResults.hits, hit=>hit._id);
    const mongoIdsToDelete = await subsetOfIdsAlgoliaShouldntIndex(collection, ids);
    const mongoIdsToDeleteDict = keyBy(mongoIdsToDelete, id=>id);
    if (mongoIdsToDelete.length > 0) {
      const hitsToDelete = _.filter(pageResults.hits, hit=>hit._id in mongoIdsToDeleteDict);
      const objectIdsToDelete = _.map(hitsToDelete, hit=>hit.objectID);
      await algoliaDeleteIds(algoliaIndex, objectIdsToDelete);
    }
    
  } while(pageResults.hits.length > 0)
}

export async function algoliaCleanAll() {
  for (let collection of indexedCollections)
    await algoliaCleanIndex(collection);
}

Vulcan.algoliaCleanIndex = wrapVulcanAsyncScript('algoliaCleanIndex', algoliaCleanIndex);
Vulcan.algoliaCleanAll = wrapVulcanAsyncScript('algoliaCleanAll', algoliaCleanAll);
Vulcan.algoliaCleanAll = algoliaCleanAll
