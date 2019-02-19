/* global Vulcan */
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users'
import Sequences from '../../lib/collections/sequences/collection.js'
import { wrapVulcanAsyncScript } from './utils'
import { getAlgoliaAdminClient, algoliaIndexDocumentBatch } from '../search/utils';
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

Vulcan.runAlgoliaExportAll = wrapVulcanAsyncScript('runAlgoliaExportAll', async () => {
  await algoliaExportByCollectionName('Posts')
  await algoliaExportByCollectionName('Users')
  await algoliaExportByCollectionName('Sequences')
  // Comments last because there's so. many.
  await algoliaExportByCollectionName('Comments')
})
