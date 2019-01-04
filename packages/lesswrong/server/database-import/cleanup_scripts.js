/* global Vulcan */

import Users from 'meteor/vulcan:users'
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import { bulkUpdateWithJS, wrapVulcanAsyncScript } from '../scripts/utils'
import { recalculateBaseScore } from '../../lib/modules/scoring.js';

Vulcan.renameDuplicateUsernames = wrapVulcanAsyncScript('renameDuplicateUsernames', async () => {
  await bulkUpdateWithJS({
    collection: Users,
    query: {username: /_duplicate/},
    queryOptions: {limit: 1},
    updateFunction: document => {
      const newUsername = document.username.replace(/_duplicate.*/, '')
      return {
        $set: {
          displayName: newUsername,
          username: newUsername,
          slug: newUsername,
        }
      }

    }
  })
})

Vulcan.updateBaseScores = wrapVulcanAsyncScript('updateBaseScores', async () => {
  for (const collection of [Posts, Comments]) {
    await bulkUpdateWithJS({
      collection,
      updateFunction: document => {
        const newBaseScore = recalculateBaseScore(document)
        return {$set: {baseScore: newBaseScore}}
      }
    })
  }
})
