import { Posts } from '../lib/collections/posts';
import { addGraphQLMutation, addGraphQLResolvers, updateMutator } from './vulcan-lib';
import { createNotification } from './notificationCallbacksHelpers';
import { accessFilterSingle } from '../lib/utils/schemaUtils';
import sortBy from 'lodash/sortBy';

const responseSortOrder = {
  yes: 1,
  maybe: 2,
  no: 3
}

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
      } else if (post.rsvps?.find(r => r.name === name && !r.email)) {
        rsvps = [...rsvps.filter(r => (r.name !== name || r.email)), newRSVP]
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
          rsvps: sortBy(rsvps, rsvp => responseSortOrder[rsvp.response] || 0 )
        },
        validate: false
      })).data

      await createNotification({userId: post.userId, notificationType: "newRSVP", documentType: "post", documentId: post._id})
      return await accessFilterSingle(currentUser, Posts, updatedPost, context);
    }
  }
});
