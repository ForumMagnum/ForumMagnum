import { Posts } from '../lib/collections/posts';
import { addGraphQLMutation, addGraphQLResolvers, updateMutator } from './vulcan-lib';


addGraphQLMutation('rsvpToEvent(postId: String, name: String, email: String, private: Boolean, response: String): Post');
addGraphQLResolvers({
  Mutation: {
    async rsvpToEvent(root: void, {postId, name, email, nonPublic, response}: {postId: string, name: string, email: string, nonPublic: boolean, response: string}, context: ResolverContext) {
      const { currentUser } = context;
      const post = await context.loaders.Posts.load(postId);
      
      if (!post.isEvent) {
        throw new Error('Post is not an event');
      }
      if (email) {
        if (post.rsvps.find(r => r.email === email && r.name === name)) {
          throw new Error('You have already RSVPed to this event');
        }
      } else {
        if (post.rsvps[post.rsvps.length - 1].name === name) {
          throw new Error('You have already RSVPed to this event');
        }
      }
      
      const updatedPost = (await updateMutator({
        collection: Posts,
        documentId: postId,
        set: {
          // This creates a race condition where two users could sign up at the
          // same time, and only one would be rsvped, but this should be rare,
          // and the user will immediately not see their name and try again
          rsvps: [
            ...(post.rsvps || []),
            {name, email, nonPublic, response, userId: currentUser?._id, createdAt: new Date()}
          ],
        }
      })).data
      
      return updatedPost
    }
  }
});
