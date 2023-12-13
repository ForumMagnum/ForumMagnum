import { addGraphQLMutation, addGraphQLResolvers } from './vulcan-lib';

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
