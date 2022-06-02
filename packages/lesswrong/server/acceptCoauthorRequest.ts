import { Posts } from '../lib/collections/posts';
import { addGraphQLMutation, addGraphQLResolvers, updateMutator } from './vulcan-lib';
import { accessFilterSingle } from '../lib/utils/schemaUtils';

addGraphQLMutation('acceptCoauthorRequest(postId: String, userId: String, accept: Boolean): Post');
addGraphQLResolvers({
  Mutation: {
    async acceptCoauthorRequest(root: void, {postId, userId, accept}: {postId: string, userId: string, accept: boolean}, context: ResolverContext) {
      const { currentUser } = context;
      const post = await context.loaders.Posts.load(postId);

      if (!post.pendingCoauthorUserIds.includes(userId)) {
        throw new Error('User has not been requested as a co-author for this post');
      }

      const coauthorUserIds = accept
        ? [ ...post.coauthorUserIds, userId ]
        : post.coauthorUserIds;
      const pendingCoauthorUserIds = post.pendingCoauthorUserIds.filter((id) => id !== userId);

      const updatedPost = (await updateMutator({
        collection: Posts,
        documentId: postId,
        set: {
          coauthorUserIds,
          pendingCoauthorUserIds,
        },
        validate: false
      })).data;

      return await accessFilterSingle(currentUser, Posts, updatedPost, context);
    },
  },
});
