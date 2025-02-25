import { Comments } from '../../lib/collections/comments/collection'
import { Posts } from '../../lib/collections/posts/collection'
import { wrapVulcanAsyncScript } from '../scripts/utils'
import { batchUpdateScore } from '../updateScores';

// Exported to allow running manually with "yarn repl"
export const forceBatchUpdateScores = wrapVulcanAsyncScript('forceBatchUpdateScores', async () => {
  // Posts
  const nActivePostsUpdated = await batchUpdateScore({
    collection: Posts,
    forceUpdate: true
  })
  // eslint-disable-next-line no-console
  console.log('nActivePostsUpdated', nActivePostsUpdated)
  const nInactivePostsUpdated = await batchUpdateScore({
    collection: Posts,
    inactive: true,
    forceUpdate: true
  })
  // eslint-disable-next-line no-console
  console.log('nInactivePostsUpdated', nInactivePostsUpdated)

  // Comments
  const nActiveCommentsUpdated = await batchUpdateScore({
    collection: Comments,
    forceUpdate: true
  })
  // eslint-disable-next-line no-console
  console.log('nActiveCommentsUpdated', nActiveCommentsUpdated)
  const nInactiveCommentsUpdated = await batchUpdateScore({
    collection: Comments,
    inactive: true,
    forceUpdate: true
  })
  // eslint-disable-next-line no-console
  console.log('nInactiveCommentsUpdated', nInactiveCommentsUpdated)
})
