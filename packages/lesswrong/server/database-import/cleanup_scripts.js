/* global Vulcan */

import Users from 'meteor/vulcan:users'
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import { bulkUpdateWithJS, wrapVulcanAsyncScript } from '../scripts/utils'
import { recalculateBaseScore } from 'meteor/vulcan:voting';

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

// TODO; may have had a problem with this not updating something
Vulcan.updateBaseScores = wrapVulcanAsyncScript('updateBaseScores', async () => {
  for (const collection of [Posts, Comments]) {
    await bulkUpdateWithJS({
      collection,
      updateFunction: document => {
        const newBaseScore = recalculateBaseScore(document._id) // TODO; is this bogus?
        return {$set: {baseScore: newBaseScore}}
      }
    })
  }
})
