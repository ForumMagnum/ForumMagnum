import { LWEvents } from '../../server/collections/lwevents/collection';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { getCommentSubtree } from '../utils/commentTreeUtils';
import { Comments } from '../../server/collections/comments/collection';
import { Users } from '../../server/collections/users/collection';
import { Posts } from '../../server/collections/posts/collection';
import moment from 'moment';
import uniq from 'lodash/uniq';
import gql from 'graphql-tag';
import { updateComment } from '../collections/comments/mutations';
import { updatePost } from '../collections/posts/mutations';
import { updateUser } from '../collections/users/mutations';
import { getSignatureWithNote } from '../../lib/collections/users/helpers';
import { approveUnreviewedSubmissions } from '../callbacks/userCallbackFunctions';
import { createConversation } from '../collections/conversations/mutations';
import { createMessage } from '../collections/messages/mutations';
import { createModeratorAction } from '../collections/moderatorActions/mutations';
import { VOTING_DISABLED } from '../../lib/collections/moderatorActions/constants';
import { rerunSaplingCheck } from '../collections/automatedContentEvaluations/helpers';

export const moderationGqlTypeDefs = gql`
  type ModeratorIPAddressInfo {
    ip: String!
    userIds: [String!]!
  }
  
  enum ContentCollectionName {
    Posts
    Comments
  }

  extend type Query {
    moderatorViewIPAddress(ipAddress: String!): ModeratorIPAddressInfo
  }

  extend type Mutation {
    lockThread(commentId: String!, until: String): Boolean!
    unlockThread(commentId: String!): Boolean!
    rejectContentAndRemoveUserFromQueue(userId: String!, documentId: String!, collectionName: ContentCollectionName!, rejectedReason: String!, messageContent: String): Boolean!
    approveUserCurrentContentOnly(userId: String!): Boolean!
    rerunSaplingCheck(documentId: String!, collectionName: ContentCollectionName!): AutomatedContentEvaluation!
  }
`

export const moderationGqlMutations = {
  async lockThread(_root: void, args: {commentId: string, until?: string}, context: ResolverContext) {
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
  async unlockThread(_root: void, args: {commentId: string}, context: ResolverContext) {
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
  },
  async rejectContentAndRemoveUserFromQueue(_root: void, args: {userId: string, documentId: string, collectionName: ContentCollectionName, rejectedReason: string, messageContent?: string}, context: ResolverContext) {
    const { currentUser } = context;
    if (!currentUser || !userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can reject content and remove users from queue");
    }

    const { userId, documentId, collectionName, rejectedReason, messageContent } = args;

    const user = await Users.findOne(userId);
    if (!user) {
      throw new Error("Invalid user ID");
    }

    if (collectionName === 'Posts') {
      const post = await Posts.findOne(documentId);
      if (!post) {
        throw new Error("Invalid post ID");
      }
      if (post.userId !== user._id) {
        throw new Error("Post does not belong to user");
      }

      await updatePost({
        data: { rejected: true, rejectedReason },
        selector: { _id: documentId }
      }, context);
    } else {
      const comment = await Comments.findOne(documentId);
      if (!comment) {
        throw new Error("Invalid comment ID");
      }
      if (comment.userId !== user._id) {
        throw new Error("Comment does not belong to user");
      }
      
      await updateComment({
        data: { rejected: true, rejectedReason },
        selector: { _id: documentId }
      }, context);
    }

    // If messageContent is provided, we restrict all of the user's permissions and send them an offboarding message
    if (messageContent) {
      const restrictNote = 'Restricted & notified (rejected content, disabled all permissions)';
      const notes = user.sunshineNotes || '';
      const newNotes = getSignatureWithNote(currentUser.displayName, restrictNote) + notes;

      await updateUser({
        data: {
          postingDisabled: true,
          allCommentingDisabled: true,
          conversationsDisabled: true,
          needsReview: false,
          reviewedByUserId: null,
          reviewedAt: user.reviewedAt ? new Date() : null,
          sunshineNotes: newNotes,
        },
        selector: { _id: userId }
      }, context);

      await createModeratorAction({
        data: {
          userId: userId,
          type: VOTING_DISABLED,
          endedAt: null,
        }
      }, context);

      const conversationData: CreateConversationDataInput = {
        participantIds: [userId, currentUser._id],
        title: `Content rejected and permissions restricted`,
        moderator: true,
      };

      const conversation = await createConversation({
        data: conversationData,
      }, context);

      const messageData = {
        userId: currentUser._id,
        contents: {
          originalContents: {
            type: "html",
            data: messageContent
          }
        },
        conversationId: conversation._id,
        noEmail: false,
      };

      await createMessage({
        data: messageData,
      }, context);
    } else {
      const notes = user.sunshineNotes || '';
      const newNotes = getSignatureWithNote(currentUser.displayName, 'removed from review queue (content rejected)') + notes;
      await updateUser({
        data: {
          needsReview: false,
          reviewedByUserId: null,
          reviewedAt: user.reviewedAt ? new Date() : null,
          sunshineNotes: newNotes,
        },
        selector: { _id: userId }
      }, context);
    }

    return true;
  },
  async approveUserCurrentContentOnly(_root: void, args: {userId: string}, context: ResolverContext) {
    const { currentUser } = context;
    if (!currentUser || !userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can approve users");
    }

    const { userId } = args;

    const user = await Users.findOne(userId);
    if (!user) {
      throw new Error("Invalid user ID");
    }

    // Approve existing content but don't set reviewedByUserId so future content still needs review
    await approveUnreviewedSubmissions(userId, context);

    const notes = user.sunshineNotes;
    const newNotes = getSignatureWithNote(currentUser.displayName, 'Approved current content only (future content will need review)') + notes;
    await updateUser({
      data: {
        sunshineFlagged: false,
        reviewedByUserId: null,
        reviewedAt: new Date(),
        needsReview: false,
        sunshineNotes: newNotes,
        snoozedUntilContentCount: null,
      },
      selector: { _id: userId }
    }, context);

    return true;
  },
  async rerunSaplingCheck(_root: void, args: { documentId: string, collectionName: ContentCollectionName }, context: ResolverContext) {
    const { currentUser } = context;
    if (!currentUser || !userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can rerun Sapling checks");
    }

    const { documentId, collectionName } = args;
    return await rerunSaplingCheck(documentId, collectionName, context);
  }
}

export const moderationGqlQueries = {
  async moderatorViewIPAddress(_root: void, args: {ipAddress: string}, context: ResolverContext) {
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
