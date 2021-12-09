import { Vulcan } from '../../lib/vulcan-lib';
import Users from '../../lib/collections/users/collection'
import { Posts } from '../../lib/collections/posts'
import Votes from '../../lib/collections/votes/collection';
import { Comments } from '../../lib/collections/comments'
import { bulkUpdateWithJS, wrapVulcanAsyncScript } from '../scripts/utils'
import { recalculateBaseScore } from '../../lib/scoring';

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
      updateFunction: async (document) => {
        const votes = await Votes.find(
          {
            documentId: document._id,
            cancelled: false
          }
        ).fetch() || [];
    
        const newBaseScore = await recalculateBaseScore(document, votes)
        return {$set: {baseScore: newBaseScore}}
      }
    })
  }
})
