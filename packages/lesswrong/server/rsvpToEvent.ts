import { Posts } from '../server/collections/posts/collection';
import { createNotification } from './notificationCallbacksHelpers';
import { accessFilterSingle } from '../lib/utils/schemaUtils';
import sortBy from 'lodash/sortBy';
import { addGraphQLMutation, addGraphQLResolvers } from "../lib/vulcan-lib/graphql";
import { updateMutator } from "./vulcan-lib/mutators";

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

      await createNotification({userId: post.userId, notificationType: "newRSVP", documentType: "post", documentId: post._id, context})
      return await accessFilterSingle(currentUser, Posts, updatedPost, context);
    }
  }
});

// TODO: Currently there is a bug where if you cancel an RSVP that shares a name with another RSVP, you may accidentally delete the wrong RSVP. We decided to merge this anyway because this feature isn't used much and overall seemed low priority, but if we ever put more time into the event system we should redo the architecture here.
addGraphQLMutation('CancelRSVPToEvent(postId: String, name: String, userId: String): Post');
addGraphQLResolvers({
  Mutation: {
    async CancelRSVPToEvent(root: void, {postId, name, userId}: {postId: string, name: string, userId: string}, context: ResolverContext) {
      const { currentUser } = context;
      const post = await context.loaders.Posts.load(postId);

      if (currentUser?._id !== userId && currentUser?._id !== post.userId) {
        throw new Error("user does not have permission to remove rsvps of this userId")
      }
      if (!post.rsvps) {
        throw new Error("There are no RSVPs to cancel on this event")
      }

      const rsvps = post.rsvps.filter(rsvp => rsvp.name !== name)

      const updatedPost = (await updateMutator({
        collection: Posts,
        documentId: postId,
        set: {
          // maybe analagous race condition? See RSVPToEvent comments- Ray
          rsvps: sortBy(rsvps, rsvp => responseSortOrder[rsvp.response] || 0 )
        },
        validate: false
      })).data

      await createNotification({userId: post.userId, notificationType: "cancelledRSVP", documentType: "post", documentId: post._id, context})
      return accessFilterSingle(currentUser, Posts, updatedPost, context);
    }
  }
});
