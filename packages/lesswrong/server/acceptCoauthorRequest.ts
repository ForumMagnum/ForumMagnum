import { Posts } from '../lib/collections/posts';
import { addGraphQLMutation, addGraphQLResolvers, updateMutator } from './vulcan-lib';
import { accessFilterSingle } from '../lib/utils/schemaUtils';

addGraphQLMutation('acceptCoauthorRequest(postId: String, userId: String): Post');
addGraphQLResolvers({
  Mutation: {
    async acceptCoauthorRequest(root: void, {postId, userId}: {postId: string, userId: string}, context: ResolverContext) {
      const { currentUser } = context;
      const post = await context.loaders.Posts.load(postId);

      if (!post.pendingCoauthorUserIds.includes(userId)) {
        throw new Error('User has not been requested as a co-author for this post');
      }

      const coauthorUserIds = [ ...post.coauthorUserIds, userId ];
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
