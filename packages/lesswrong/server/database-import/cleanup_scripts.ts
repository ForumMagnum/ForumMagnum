import Users from '../../server/collections/users/collection'
import { Posts } from '../../server/collections/posts/collection'
import { Comments } from '../../server/collections/comments/collection'
import { bulkUpdateWithJS, wrapVulcanAsyncScript } from '../scripts/utils'
import { recalculateDocumentScores } from '../voteServer';
import { createAdminContext } from '../vulcan-lib/createContexts';

export const renameDuplicateUsernames = wrapVulcanAsyncScript('renameDuplicateUsernames', async () => {
  await bulkUpdateWithJS({
    collection: Users,
    query: {username: /_duplicate/},
    queryOptions: {limit: 1},
    updateFunction: (document: AnyBecauseObsolete) => {
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

export const updateBaseScores = wrapVulcanAsyncScript('updateBaseScores', async () => {
  const context = await createAdminContext();
  
  for (const collection of [Posts, Comments]) {
    await bulkUpdateWithJS({
      collection,
      updateFunction: async (document: AnyBecauseObsolete) => {
        const scoreFields = await recalculateDocumentScores(document, collection.collectionName, context)
        return {$set: {...scoreFields}}
      }
    })
  }
})
