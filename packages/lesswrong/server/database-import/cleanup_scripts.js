/* global Vulcan */
import Users from 'meteor/vulcan:users'
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import { bulkUpdateWithJS } from '../scripts/utils'
import { recalculateBaseScore } from 'meteor/vulcan:voting';

Vulcan.renameDuplicateUsernames = async () => {
  await bulkUpdateWithJS({
    collection: Users,
    query: {username: /_duplicate/},
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
}

Vulcan.updateBaseScores = async () => {
  for (collection of [Posts, Comments]) {
    await bulkUpdateWithJS({
      collection,
      updateFunction: document => {
        const newBaseScore = recalculateBaseScore(document._id)
        return {$set: {baseScore: newBaseScore}}
      }
    })
  }
}
