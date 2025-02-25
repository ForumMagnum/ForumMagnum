import { defineMutation } from './utils/serverGraphqlUtil';
import { addGraphQLMutation, addGraphQLResolvers } from '../lib/vulcan-lib/graphql';

addGraphQLMutation('markAsReadOrUnread(postId: String, isRead:Boolean): Boolean');
addGraphQLResolvers({
  Mutation: {
    async markAsReadOrUnread(root: void, {postId, isRead}: {postId: string, isRead: boolean}, context: ResolverContext) {
      const { currentUser } = context;
      if (!currentUser) return isRead;

      await context.repos.readStatuses.upsertReadStatus(currentUser._id, postId, isRead);
      
      // TODO: Create an entry in LWEvents
      
      return isRead;
    }
  }
});

defineMutation({
  name: 'markPostCommentsRead',
  argTypes: '(postId: String!)',
  resultType: 'Boolean',
  fn: async (_, { postId }: { postId: string }, context) => {
    const { currentUser, repos } = context;

    if (!currentUser) {
      throw new Error('You need to be logged in to mark post comments read');
    }

    await context.repos.readStatuses.upsertReadStatus(currentUser._id, postId, false, { skipIsReadUpdateOnUpsert: true });
  }
});
