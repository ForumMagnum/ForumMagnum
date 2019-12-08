import { addGraphQLMutation, addGraphQLResolvers } from 'meteor/vulcan:core';
import { ReadStatuses } from '../lib/collections/readStatus/collection.js';


addGraphQLMutation('markAsReadOrUnread(postId: String, isRead:Boolean): Boolean');
addGraphQLResolvers({
  Mutation: {
    async markAsReadOrUnread(root, {postId, isRead}, context) {
      const { currentUser } = context;
      
      // TODO: Create an entry in LWEvents
      
      ReadStatuses.rawCollection().update({
        postId: postId,
        userId: currentUser._id,
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
