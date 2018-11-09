/* global Vulcan */
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

