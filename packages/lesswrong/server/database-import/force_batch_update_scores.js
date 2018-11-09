/* global Vulcan, Meteor */
import { Comments } from '../../lib/collections/comments'
import { Posts } from '../../lib/collections/posts'

import { batchUpdateScore, recalculateBaseScore } from 'meteor/vulcan:voting';

Vulcan.forceBatchUpdateScores = async () => {
  console.log('==============| Updated the scores of all posts and comments')
  // Posts
  const nActivePostsUpdated = await batchUpdateScore({collection: Posts, forceUpdate: true})
  console.log('nActivePostsUpdated', nActivePostsUpdated)
  const nInactivePostsUpdated = await batchUpdateScore({collection: Posts, inactive: true, forceUpdate: true})
  console.log('nInactivePostsUpdated', nInactivePostsUpdated)

  // Comments
  const nActiveCommentsUpdated = await batchUpdateScore({collection: Comments, forceUpdate: true})
  console.log('nActiveCommentsUpdated', nActiveCommentsUpdated)
  const nInactiveCommentsUpdated = await batchUpdateScore({collection: Comments, inactive: true, forceUpdate: true})
  console.log('nInactiveCommentsUpdated', nInactiveCommentsUpdated)
}

const executeBulkGetErrors = async bulk => {
  console.log('exec bulk get errs')
  const result = await bulk.execute()
  console.log('result', result)
}

// updates: id, operation
const anyBulkUpdate = async ({collection, documents, update, batchSize=200}) => {
  console.log('any bulk update')
  console.log('collection name', collection.collectionName)
  let bulk = collection.rawCollection().initializeOrderedBulkOp()
  let count = 0
  let totalWriteErrors = []
  for (const document of documents) {
    const updateOperation = update(document)
    bulk.find({_id: document._id}).updateOne(updateOperation)
    if (count % batchSize === 0) {
      const writeErrors = await executeBulkGetErrors(bulk)
    }
  }
  console.log('fmlman bulk', bulk)
  // update
}

const updateBaseScoresCollection = async collection => {
  console.log('Updating base scores for all', collection.collectionName)
  const allDocumentsCursor = collection.find({_id: 'pjt5x3ASwrPY2YyhJ'}) // TODO remove -------
  console.log('allDocs count', allDocumentsCursor.count())

  const result = await anyBulkUpdate({
    collection,
    documents: allDocumentsCursor,
    update: document => {
      const newBaseScore = recalculateBaseScore(document._id)
      return {$set: {baseScore: newBaseScore}}
    }
  })
}

// TODO; wrap vulcan async script

Vulcan.updateBaseScores = async () => {
  try {
    await updateBaseScoresCollection(Posts)
    // await updateBaseScoresCollection(Comments)
    console.log('updateBaseScores success!')
  } catch (err) {
    console.error('updateBaseScores failed', err)
  }
  console.log('----- exiting updateBaseScores ------------------- ')
}

import Users from 'meteor/vulcan:users'
Vulcan.renameDuplicateUsernames = async () => {
  const duplicateUsersCursor = Users.find({username: /_duplicate/}, {limit: 1})
  const usersList = duplicateUsersCursor.fetch()
  console.log('usersList', usersList)
  const result = await anyBulkUpdate({
    collection: Users,
    documents: duplicateUsersCursor,
    update: document => {
      const newDisplayname = document.username.replace(/_duplicate.*/, '')
      return {
        $set: {
          displayName: newDisplayname,
          username: newDisplayname,
          slug: newDisplayname,
        }
      }
    }
  })
}

// // ewwww gross
// const promiseArray = allDocumentsCursor.map(document => {
//   console.log('updating document with id', document._id)
//   const newBaseScore = recalculateBaseScore(document._id)
//   console.log('got here 1')
//   const updateAsync = Meteor.bindEnvironment(collection.update)
//   console.log('got here 1.25')
//   return updateAsync({_id: document._id}, {$set: {baseScore: newBaseScore}})
// })
// console.log('got here 1.5')
// for (const updatePromise of promiseArray) {
//   console.log('got here 2')
//   const updateResult = await updatePromise
//   console.log('updateResult keys', Object.keys(updateResult))
// }
