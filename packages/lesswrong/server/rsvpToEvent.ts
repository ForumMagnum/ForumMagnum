import { Posts } from '../lib/collections/posts';
import { addGraphQLMutation, addGraphQLResolvers, updateMutator } from './vulcan-lib';


addGraphQLMutation('RSVPToEvent(postId: String, name: String, email: String, private: Boolean, response: String): Post');
addGraphQLResolvers({
  Mutation: {
    async RSVPToEvent(root: void, {postId, name, email, nonPublic, response}: {postId: string, name: string, email: string, nonPublic: boolean, response: string}, context: ResolverContext) {
      const { currentUser } = context;
      const post = await context.loaders.Posts.load(postId);
      const newRSVP = {name, email, nonPublic, response, userId: currentUser?._id, createdAt: new Date()}
      let rsvps = post.rsvps || []
      
      if (!post.isEvent) {
        throw new Error('Post is not an event');
      }
      if (email && post.rsvps?.find(r => r.email === email && r.name === name)) {
        rsvps = [...rsvps.filter(r => (r.email !== email || r.name !== name)), newRSVP]
      } else if (post.rsvps && post.rsvps[post.rsvps.length - 1].name === name) {
        rsvps = [...rsvps.filter(r => r.name !== name), newRSVP]
      } else {
        rsvps = [...rsvps, newRSVP]
      }
      
      const updatedPost = (await updateMutator({
        collection: Posts,
        documentId: postId,
        set: {
          // This creates a race condition where two users could sign up at the
          // same time, and only one would be rsvped, but this should be rare,
          // and the user will immediately not see their name and try again
          rsvps
        },
        validate: false
      })).data
      
      return updatedPost
    }
  }
});
