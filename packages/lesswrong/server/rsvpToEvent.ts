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

type ValidResponse = keyof typeof responseSortOrder;
const isValidResponse = (response: string): response is ValidResponse => {
  return response in responseSortOrder;
}

addGraphQLMutation('RSVPToEvent(postId: String, name: String, email: String, private: Boolean, response: String): Post');
addGraphQLResolvers({
  Mutation: {
    async RSVPToEvent(root: void, {postId, name, email, nonPublic, response}: {postId: string, name: string, email: string, nonPublic: boolean, response: string}, context: ResolverContext) {
      const { currentUser } = context;

      if (!isValidResponse(response)) {
        throw new Error('Error submitting RSVP: Invalid response');
      }

      // The generated db type expects null, not undefined, for an absent value
      const userId = currentUser?._id ?? null;

      const post = await context.loaders.Posts.load(postId);
      const newRSVP = {name, email, nonPublic, response, userId, createdAt: new Date()}
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

addGraphQLMutation('CancelRSVPToEvent(postId: String, name: String, userId: String): Post');
addGraphQLResolvers({
  Mutation: {
    async CancelRSVPToEvent(root: void, {postId, name, userId}: {postId: string, name: string, userId: string}, context: ResolverContext) {
      const { currentUser } = context;
      const post = await context.loaders.Posts.load(postId);
      console.log("currentUser", currentUser?._id)
      console.log(currentUser?._id, userId, post.userId)
      console.log(currentUser?._id !== userId)
      console.log(userId !== post.userId)
      if (currentUser?._id !== userId && currentUser?._id !== post.userId) {
        throw new Error("user does not have permission to remove rsvps of this userId")
      }

      // eslint-disable-next-line no-console
      console.log("old rsvps", post.rsvps)
      let rsvps = post.rsvps.filter(rsvp => rsvp.name !== name) || []

      // eslint-disable-next-line no-console
      console.log("new rsvps", rsvps)

      const updatedPost = (await updateMutator({
        collection: Posts,
        documentId: postId,
        set: {
          // maybe analagous race condition? - Ray
          rsvps: sortBy(rsvps, rsvp => responseSortOrder[rsvp.response] || 0 )
        },
        validate: false
      })).data

      await createNotification({userId: post.userId, notificationType: "cancelledRSVP", documentType: "post", documentId: post._id})
      return await accessFilterSingle(currentUser, Posts, updatedPost, context);
    }
  }
});