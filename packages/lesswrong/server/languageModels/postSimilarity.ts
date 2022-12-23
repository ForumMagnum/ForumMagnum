import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { Posts } from '../../lib/collections/posts/collection';

augmentFieldsDict(Posts, {
  similarPosts: {
    resolveAs: {
      type: '[Post!]',
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<DbPost[]> => {
        // TODO
        return [];
      }
    },
  },
});

addCronJob({
});

getCollectionHooks("Posts").editAsync.add(async (newPost,oldPost) {
  // TODO: Replace embedding
})


getCollectionHooks("Posts").newAfter.add(async (post) {
  // TODO: Create embedding
})
