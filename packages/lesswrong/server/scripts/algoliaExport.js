/* global Vulcan */
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users'
import Sequences from '../../lib/collections/sequences/collection.js'
import algoliasearch from 'algoliasearch'
import { getSetting } from 'meteor/vulcan:core'
import { wrapVulcanAsyncScript } from './utils'

// Slightly gross function to turn these callback-accepting functions
// into async ones
async function batchAdd (algoliaIndex, objects, waitForFinish) {
  const addObjectsPartialAsync = () => {
    return new Promise((resolve, reject) => {
      algoliaIndex.addObjects(objects, (err, content) => {
        if (err) {
          reject(err)
          return
        }
        resolve(content)
      })
    })
  }
  const awaitObjectInsert = (taskID) => {
    return new Promise((resolve, reject) => {
      algoliaIndex.waitTask(taskID, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }
  try {
    const content = await addObjectsPartialAsync()
    if (waitForFinish) {
      await awaitObjectInsert(content.taskID)
    } else {
      algoliaIndex.waitTask(content.taskID, (err) => {
        if (err) console.error(
          'Apparently algolia sometimes errors even after the first ack\n' +
          'Please make a note of this error and then be frustrated about' +
          'how to change the code to do a better job of catching it.'
        )
      })
    }
  } catch (err) {
    return err
  }
}

async function algoliaExport(Collection, indexName, selector = {}, updateFunction) {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaAdminKey = getSetting('algolia.adminKey')
  let client = algoliasearch(algoliaAppId, algoliaAdminKey)
  console.log(`Exporting ${indexName}...`)
  let algoliaIndex = client.initIndex(indexName)
  console.log("Initiated Index connection")

  let importCount = 0
  let importBatch = []
  let batchContainer
  const totalErrors = []
  const documents = Collection.find(selector, {limit: 7}) // TODO; no limit
  const numItems = documents.count()
  console.log(`Beginning to import ${numItems} ${Collection._name}`)
  for (let item of documents) {
    if (updateFunction) updateFunction(item)
    // console.log('item', item)
    batchContainer = Collection.toAlgolia(item)
    // console.log('batchContainer', batchContainer)
    importBatch = [...importBatch, ...batchContainer]
    importCount++
    if (importCount % 3 == 0) {
      // Could be more algolia objects than documents
      console.log(`Exporting ${importBatch.length} algolia objects`)
      console.log('Documents so far:', importCount)
      console.log('Total documents: ', numItems)
      const err = await batchAdd(algoliaIndex, importBatch, false)
      if (err) {
        totalErrors.push(err)
      }
      importBatch = []
    }
  }
  console.log(`Exporting last ${importBatch.length} algolia objects`)
  const err = await batchAdd(algoliaIndex, importBatch, false)
  if (err) {
    totalErrors.push(err)
  }
  if (totalErrors) {
    console.log(`${Collection._name} indexing encountered the following errors:`, totalErrors)
  } else {
    console.log('No errors found when indexing', Collection._name)
  }
}

Vulcan.runAlgoliaExport = wrapVulcanAsyncScript('runAlgoliaExport', async () => {
  await algoliaExport(Posts, 'test_posts', {baseScore: {$gt: 0}, draft: {$ne: true}})
  // algoliaExport(Comments, 'test_comments', {baseScore: {$gt: 0}, isDeleted: {$ne: true}})
  // algoliaExport(Users, 'test_users', {deleted: {$ne: true}})
  // algoliaExport(Sequences, 'test_sequences')
})
