import { defineQuery, defineMutation } from '../utils/serverGraphqlUtil';
import { LWEvents } from '../../lib/collections/lwevents/collection';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { getCommentSubtree } from '../utils/commentTreeUtils';
import { Comments } from '../../lib/collections/comments/collection';
import { updateMutator } from '../vulcan-lib/mutators';
import moment from 'moment';
import uniq from 'lodash/uniq';

defineQuery({
  name: "moderatorViewIPAddress",
  argTypes: "(ipAddress: String!)",
  resultType: "ModeratorIPAddressInfo",
  schema: `
    type ModeratorIPAddressInfo {
      ip: String!
      userIds: [String!]!
    }
  `,
  fn: async (_root: void, args: {ipAddress: string}, context: ResolverContext) => {
    const { currentUser } = context;
    const { ipAddress } = args;
    if (!currentUser || !currentUser.isAdmin)
      throw new Error("Only admins can see IP address information");
    
    const loginEvents = await LWEvents.find({
      name: "login",
      "properties.ip": ipAddress,
    }, {limit: 100}).fetch();
    
    const userIds = uniq(loginEvents.map(loginEvent => loginEvent.userId));
    return {
      ip: ipAddress,
      userIds,
    };
  }
});

defineMutation({
  name: "lockThread",
  argTypes: "(commentId: String!, until: String)",
  resultType: "Boolean!",
  fn: async (_root: void, args: {commentId: string, until?: string}, context: ResolverContext) => {
    const { currentUser } = context;
    if (!userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can lock or unlock threads");
    }
    
    // Get a list of all comments nested under this one, recursively
    const rootComment = await Comments.findOne({_id: args.commentId});
    if (!rootComment) {
      throw new Error("Invalid comment ID for lockThread");
    }
    const commentsInThread: DbComment[] = await getCommentSubtree(rootComment);
    
    const farFuture = moment().add(1000, 'years').toDate();
    const expiryDate = args.until
      ? moment(args.until).toDate()
      : farFuture;
    
    // Mark them all as replies-locked
    await Promise.all(commentsInThread.map(async (comment) => {
      await updateMutator({
        collection: Comments,
        documentId: comment._id,
        set: {
          repliesBlockedUntil: expiryDate,
        },
        context,
      });
    }));
    
    return true;
  }
});

defineMutation({
  name: "unlockThread",
  argTypes: "(commentId: String!)",
  resultType: "Boolean!",
  fn: async (_root: void, args: {commentId: string}, context: ResolverContext) => {
    const { currentUser } = context;
    if (!userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can lock or unlock threads");
    }
    
    // Check whether this comment has a parent (or other ancestors) that are also
    // locked. If so, climb the tree first, so that thread-unlocking something
    // that wasn't the root of the thread-lock will get the whole thread.
    const startComment = await Comments.findOne({_id: args.commentId});
    if (!startComment) {
      throw new Error("Invalid comment ID for unlockThread");
    }
    let rootOfLocking = startComment;
    while (rootOfLocking.parentCommentId) {
      const parentComment = await Comments.findOne({_id: rootOfLocking.parentCommentId});
      if (parentComment
        && parentComment._id!==rootOfLocking._id
        && parentComment.repliesBlockedUntil
        && startComment.repliesBlockedUntil
        && parentComment.repliesBlockedUntil.toISOString()===startComment.repliesBlockedUntil.toISOString()
      ) {
        rootOfLocking = parentComment;
      } else {
        break;
      }
    }

    // Get a list of all comments nested under this one, recursively
    const commentsInThread: DbComment[] = await getCommentSubtree(rootOfLocking);
    
    // Unmark them all as replies-locked
    await Promise.all(commentsInThread.map(async (comment) => {
      await updateMutator({
        collection: Comments,
        documentId: comment._id,
        unset: {
          repliesBlockedUntil: 1,
        },
        context,
      });
    }));

    return true;
  }
});
