/* global Vulcan */

import Users from 'meteor/vulcan:users'
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import { bulkUpdateWithJS } from '../scripts/utils'
import { recalculateBaseScore } from 'meteor/vulcan:voting';

Vulcan.renameDuplicateUsernames = async () => {
  const result = await bulkUpdateWithJS({
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
  console.log('result outer', result)
}

Vulcan.updateBaseScores = async () => {
  for (collection of [Posts]) { // [Posts, Comments]) {
    const result = await bulkUpdateWithJS({
      collection,
      query: {_id: 'pjt5x3ASwrPY2YyhJ'},           // TODO remove ------------------------
      updateFunction: document => {
        // TODO why are votes not working to get joeys post back to 19
        const newBaseScore = recalculateBaseScore(document._id)
        return {$set: {baseScore: newBaseScore}}
      }
    })
    console.log('result outer', result)
  }
}
