import { LWEvents } from '../../server/collections/lwevents/collection';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { getCommentSubtree } from '../utils/commentTreeUtils';
import { Comments } from '../../server/collections/comments/collection';
import moment from 'moment';
import uniq from 'lodash/uniq';
import gql from 'graphql-tag';
import { updateComment } from '../collections/comments/mutations';

export const moderationGqlTypeDefs = gql`
  type ModeratorIPAddressInfo {
    ip: String!
    userIds: [String!]!
  }
  extend type Query {
    moderatorViewIPAddress(ipAddress: String!): ModeratorIPAddressInfo
  }

  extend type Mutation {
    lockThread(commentId: String!, until: String): Boolean!
    unlockThread(commentId: String!): Boolean!
  }
`

export const moderationGqlMutations = {
  async lockThread (_root: void, args: {commentId: string, until?: string}, context: ResolverContext) {
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
      await updateComment({
        data: {
          repliesBlockedUntil: expiryDate,
        }, selector: { _id: comment._id }
      }, context);
    }));
    
    return true;
  },
  async unlockThread (_root: void, args: {commentId: string}, context: ResolverContext) {
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
      await updateComment({ data: { repliesBlockedUntil: null }, selector: { _id: comment._id } }, context);
    }));

    return true;
  }
}

export const moderationGqlQueries = {
  async moderatorViewIPAddress (_root: void, args: {ipAddress: string}, context: ResolverContext) {
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
}
