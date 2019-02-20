/* global Vulcan */
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users'
import Sequences from '../../lib/collections/sequences/collection.js'
import { wrapVulcanAsyncScript } from './utils'
import { getAlgoliaAdminClient, algoliaIndexDocumentBatch, algoliaDeleteIds, algoliaDoSearch, subsetOfIdsAlgoliaShouldntIndex } from '../search/utils';
import { forEachDocumentBatchInCollection } from '../queryUtil';


async function algoliaExport(collection, selector = {}, updateFunction) {
  let client = getAlgoliaAdminClient();
  if (!client) return;
  
  // eslint-disable-next-line no-console
  console.log(`Exporting ${collection.algoliaIndexName}...`)
  let algoliaIndex = client.initIndex(collection.algoliaIndexName)
  
  // eslint-disable-next-line no-console
  console.log("Initiated Index connection")
  
  const totalErrors = [];
  const totalItems = collection.find(selector).count();
  let exportedSoFar = 0;
  
  await forEachDocumentBatchInCollection(collection, 100, async (documents) => {
    algoliaIndexDocumentBatch({ documents, collection, algoliaIndex,
      errors: totalErrors, updateFunction });
    
    exportedSoFar += documents.length;
    // eslint-disable-next-line no-console
    console.log(`Exported ${exportedSoFar}/${totalItems} entries to Algolia`);
  });
  
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

Vulcan.runAlgoliaExport = wrapVulcanAsyncScript('runAlgoliaExport', async (collectionName) => {
  await algoliaExportByCollectionName(collectionName)
})

const indexedCollections = { Posts, Users, Sequences, Comments };

Vulcan.runAlgoliaExportAll = wrapVulcanAsyncScript('runAlgoliaExportAll', async () => {
  for (let collection of indexedCollections)
    await algoliaExportByCollectionName(collection.collectionName);
})


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
  let algoliaIndex = client.initIndex(collection.algoliaIndexName);
  
  let currentPage = 0;
  let pageResults;
  do {
    pageResults = await algoliaDoSearch(algoliaIndex, {
      query: "",
      attributesToRetrieve: ['objectID'],
      hitsPerPage: 1000,
      page: currentPage,
    });
    currentPage++;
    
    const ids = _.map(pageResults.hits, hit=>hit._id);
    const idsToDelete = await subsetOfIdsAlgoliaShouldntIndex(collection, ids);
    if (idsToDelete.length > 0) {
      await algoliaDeleteIds(algoliaIndex, idsToDelete);
    }
    
  } while(pageResults.hits.length > 0)
}

Vulcan.algoliaCleanIndex = wrapVulcanAsyncScript('algoliaCleanIndex', algoliaCleanIndex);
Vulcan.algoliaCleanIndex = wrapVulcanAsyncScript('algoliaCleanAll', async () => {
  for (let collection of indexedCollections)
    await algoliaCleanIndex(collection);
});
