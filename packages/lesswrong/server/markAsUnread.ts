import { addGraphQLMutation, addGraphQLResolvers } from './vulcan-lib';
import { ReadStatuses } from '../lib/collections/readStatus/collection';


addGraphQLMutation('markAsReadOrUnread(postId: String, isRead:Boolean): Boolean');
addGraphQLResolvers({
  Mutation: {
    async markAsReadOrUnread(root: void, {postId, isRead}: {postId: string, isRead: boolean}, context: ResolverContext) {
      const { currentUser } = context;
      if (!currentUser) return isRead;
      
      // TODO: Create an entry in LWEvents
      
      await ReadStatuses.rawUpdateOne({
        postId: postId,
        userId: currentUser._id,
        tagId: null,
      }, {
        $set: {
          isRead: isRead,
          lastUpdated: new Date(),
        },
      }, {
        upsert: true
      });
      
      return isRead;
    }
  }
});
