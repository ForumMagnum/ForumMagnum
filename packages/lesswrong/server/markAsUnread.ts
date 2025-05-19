import gql from 'graphql-tag';

export const markAsUnreadTypeDefs = gql`
  extend type Mutation {
    markAsReadOrUnread(postId: String, isRead:Boolean): Boolean
    markPostCommentsRead(postId: String!): Boolean
  }
`

export const markAsUnreadMutations = {
  async markAsReadOrUnread(root: void, {postId, isRead}: {postId: string, isRead: boolean}, context: ResolverContext) {
    const { currentUser } = context;
    if (!currentUser) return isRead;

    await context.repos.readStatuses.upsertReadStatus(currentUser._id, postId, isRead);
    
    // TODO: Create an entry in LWEvents
    
    return isRead;
  },
  async markPostCommentsRead (_: void, { postId }: { postId: string }, context: ResolverContext) {
    const { currentUser } = context;

    if (!currentUser) {
      throw new Error('You need to be logged in to mark post comments read');
    }

    await context.repos.readStatuses.upsertReadStatus(currentUser._id, postId, false, { skipIsReadUpdateOnUpsert: true });
  }
}
