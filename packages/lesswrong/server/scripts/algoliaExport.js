/* global Vulcan */
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users'
import Sequences from '../../lib/collections/sequences/collection.js'
import algoliasearch from 'algoliasearch'
import { getSetting } from 'meteor/vulcan:core'
import { wrapVulcanAsyncScript } from './utils'
import { batchAdd } from '../search/utils';

async function algoliaExport(collection, indexName, selector = {}, updateFunction) {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaAdminKey = getSetting('algolia.adminKey')
  let client = algoliasearch(algoliaAppId, algoliaAdminKey)
  // eslint-disable-next-line no-console
  console.log(`Exporting ${indexName}...`)
  let algoliaIndex = client.initIndex(indexName)
  // eslint-disable-next-line no-console
  console.log("Initiated Index connection")

  let importCount = 0
  let importBatch = []
  let batchContainer
  const totalErrors = []
  const documents = collection.find(selector)
  const numItems = documents.count()
  // eslint-disable-next-line no-console
  console.log(`Beginning to import ${numItems} ${collection._name}`)
  for (let item of documents) {
    if (updateFunction) updateFunction(item)
    batchContainer = collection.toAlgolia(item)
    importBatch = [...importBatch, ...batchContainer]
    importCount++
    if (importCount % 100 === 0) {
      // Could be more algolia objects than documents
      // eslint-disable-next-line no-console
      console.log(`Exporting ${importBatch.length} algolia objects`)
      // eslint-disable-next-line no-console
      console.log('Documents so far:', importCount)
      // eslint-disable-next-line no-console
      console.log('Total documents: ', numItems)
      const err = await batchAdd(algoliaIndex, importBatch, false)
      if (err) {
        totalErrors.push(err)
      }
      importBatch = []
    }
  }
  // eslint-disable-next-line no-console
  console.log(`Exporting last ${importBatch.length} algolia objects`)
  const err = await batchAdd(algoliaIndex, importBatch, false)
  if (err) {
    totalErrors.push(err)
  }
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
      await algoliaExport(Posts, 'test_posts', {baseScore: {$gte: 0}, draft: {$ne: true}, status: 2})
      break
    case 'Comments':
      await algoliaExport(Comments, 'test_comments', {baseScore: {$gt: 0}, isDeleted: {$ne: true}})
      break
    case 'Users':
      await algoliaExport(Users, 'test_users', {deleted: {$ne: true}})
      break
    case 'Sequences':
      await algoliaExport(Sequences, 'test_sequences')
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
