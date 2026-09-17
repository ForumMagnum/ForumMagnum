import { LWEvents } from '../../server/collections/lwevents/collection';
import { userIsAdmin, userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { getCommentSubtree } from '../utils/commentTreeUtils';
import { Comments } from '../../server/collections/comments/collection';
import { Users } from '../../server/collections/users/collection';
import { Posts } from '../../server/collections/posts/collection';
import moment from 'moment';
import uniq from 'lodash/uniq';
import gql from 'graphql-tag';
import { createComment, updateComment } from '../collections/comments/mutations';
import { updatePost } from '../collections/posts/mutations';
import { updateUser } from '../collections/users/mutations';
import { getSignatureWithNote } from '../../lib/collections/users/helpers';
import { approveUnreviewedSubmissions } from '../callbacks/userCallbackFunctions';
import { createConversation } from '../collections/conversations/mutations';
import { createMessage } from '../collections/messages/mutations';
import { createModeratorAction } from '../collections/moderatorActions/mutations';
import { VOTING_DISABLED } from '../../lib/collections/moderatorActions/constants';
import { createAutomatedContentEvaluation, getPangramEvaluationForText, rerunLlmCheck } from '../collections/automatedContentEvaluations/helpers';
import type { PangramModel } from '../../lib/collections/automatedContentEvaluations/constants';
import { accessFilterMultiple, accessFilterSingle } from '../../lib/utils/schemaUtils';
import { viewTermsToQuery } from '../../lib/utils/viewUtils';
import { UsersViews } from '../../lib/collections/users/views';
import { getUserReviewGroup } from '../../lib/collections/users/reviewGroupResolvers';

export const moderationGqlTypeDefs = gql`
  type ModerationUserQueueCounts {
    newContent: Int!
    offboard: Int!
    highContext: Int!
    maybeSpam: Int!
    automod: Int!
    snoozeExpired: Int!
    unknown: Int!
  }

  type ModerationNewUsersResult {
    results: [User!]!
    totalCount: Int
  }

  type ModeratorIPAddressInfo {
    ip: String!
    userIds: [String!]!
  }
  
  type PangramTextEvaluationResult {
    analyzedText: String!
    pangramApiVersion: String!
    pangramScore: Float!
    pangramMaxScore: Float
    pangramPrediction: String
    pangramWindowScores: [PangramWindowScore!]
  }

  enum PangramModel {
    pangram3
    pangram4
  }
  
  enum ContentCollectionName {
    Posts
    Comments
  }

  extend type Query {
    moderationNewUsers(limit: Int, enableTotal: Boolean): ModerationNewUsersResult!
    moderationUserQueueCounts: ModerationUserQueueCounts!
    moderatorViewIPAddress(ipAddress: String!): ModeratorIPAddressInfo
  }

  extend type Mutation {
    lockThread(commentId: String!, until: String): Boolean!
    unlockThread(commentId: String!): Boolean!
    rejectContentAndRemoveUserFromQueue(userId: String!, documentId: String!, collectionName: ContentCollectionName!, rejectedReason: String!, messageContent: String): Boolean!
    approveUserCurrentContentOnly(userId: String!): Boolean!
    rerunLlmCheck(documentId: String!, collectionName: ContentCollectionName!): AutomatedContentEvaluation!
    runLlmCheckForDocument(documentId: String!, collectionName: ContentCollectionName!): AutomatedContentEvaluation!
    runPangramOnText(text: String!, model: PangramModel): PangramTextEvaluationResult!
    unlistLlmPost(postId: String!, modCommentHtml: String!): Boolean!
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
  async rerunLlmCheck(_root: void, args: { documentId: string, collectionName: ContentCollectionName }, context: ResolverContext) {
    const { currentUser } = context;
    if (!currentUser || !userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can rerun LLM detection checks");
    }

    const { documentId, collectionName } = args;
    return await rerunLlmCheck(documentId, collectionName, context);
  },
  async runLlmCheckForDocument(_root: void, args: { documentId: string, collectionName: ContentCollectionName }, context: ResolverContext) {
    const { currentUser, Posts, Comments, Revisions, AutomatedContentEvaluations } = context;
    if (!currentUser || !userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can run LLM checks");
    }

    const { documentId, collectionName } = args;

    let contentsLatest: string | null = null;

    if (collectionName === "Posts") {
      const post = await Posts.findOne({ _id: documentId });
      if (!post) {
        throw new Error("Post not found");
      }
      contentsLatest = post.contents_latest;
    } else {
      const comment = await Comments.findOne({ _id: documentId });
      if (!comment) {
        throw new Error("Comment not found");
      }
      contentsLatest = comment.contents_latest;
    }
  
    // Get the latest published revision
    const revision = contentsLatest
      ? await Revisions.findOne({ _id: contentsLatest })
      : null;
  
    if (!revision) {
      throw new Error(`No published revision found for ${collectionName === "Posts" ? "post" : "comment"}`);
    }
  
    const existingAce = await AutomatedContentEvaluations.findOne({ revisionId: revision._id });
    if (existingAce) {
      throw new Error(`An automated content evaluation already exists for this ${collectionName === "Posts" ? "post" : "comment"}. Use rerunLlmCheck to update it.`);
    }
  
    const aceId = await createAutomatedContentEvaluation(revision, context, { autoreject: false });
    if (!aceId) {
      throw new Error("Failed to create automated content evaluation");
    }
  
    const ace = await AutomatedContentEvaluations.findOne({ _id: aceId });
    if (!ace) {
      throw new Error("Failed to fetch created automated content evaluation");
    }

    return ace;
  },
  async runPangramOnText(_root: void, args: { text: string, model?: PangramModel | null }, context: ResolverContext) {
    const { currentUser } = context;
    if (!currentUser || !userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can run Pangram checks");
    }

    const trimmed = args.text.trim();
    if (!trimmed) {
      throw new Error("Text is required");
    }

    return await getPangramEvaluationForText(trimmed, args.model ?? undefined);
  },
  async unlistLlmPost(_root: void, args: {postId: string, modCommentHtml: string}, context: ResolverContext) {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error("Only admins can unlist posts due to LLM policy violations");
    }

    const { postId, modCommentHtml } = args;

    const post = await Posts.findOne(postId);
    if (!post) {
      throw new Error("Invalid post ID");
    }

    const user = await Users.findOne(post.userId);
    if (!user) {
      throw new Error("Post author not found");
    }

    // Unlist the post
    await updatePost({
      data: { unlisted: true },
      selector: { _id: postId }
    }, context);

    // Post a moderator comment on the post
    await createComment({
      data: {
        postId,
        contents: {
          originalContents: {
            type: "html",
            data: modCommentHtml,
          }
        },
        moderatorHat: true,
      }
    }, context);

    // Unapprove the user so future content needs review
    const notes = user.sunshineNotes || '';
    const newNotes = getSignatureWithNote(currentUser.displayName, 'LLM policy violation - unapproved user, unlisted post') + notes;
    await updateUser({
      data: {
        reviewedByUserId: null,
        reviewedAt: user.reviewedAt ? new Date() : null,
        needsReview: true,
        sunshineNotes: newNotes,
      },
      selector: { _id: user._id }
    }, context);

    return true;
  },
}

async function getNewUserQueueSelector(context: ResolverContext) {
  const { selector } = await viewTermsToQuery(UsersViews, { view: 'sunshineNewUsers' }, {}, context);
  return selector;
}

export const moderationGqlQueries = {
  // The sunshineNewUsers view, ordered by how long each user's oldest post or
  // comment has waited for review. That order needs a join, so it can't be
  // expressed as a view sort.
  async moderationNewUsers(_root: void, args: {limit?: number | null, enableTotal?: boolean | null}, context: ResolverContext) {
    const { currentUser } = context;
    if (!userIsAdminOrMod(currentUser)) {
      throw new Error('Only admins and moderators can see the new user queue');
    }
    const limit = args.limit ?? 10;
    if (limit < 0) throw new Error('Queue limit must be nonnegative');
    const selector = await getNewUserQueueSelector(context);
    const [users, totalCount] = await Promise.all([
      context.repos.users.getNewUsersByOldestUnreviewedContent(selector, limit),
      args.enableTotal ? context.Users.find(selector).count() : undefined,
    ]);
    return {
      results: await accessFilterMultiple(currentUser, 'Users', users, context),
      totalCount,
    };
  },
  async moderationUserQueueCounts(_root: void, _args: Record<string, never>, context: ResolverContext): Promise<Record<ReviewGroup, number>> {
    if (!userIsAdminOrMod(context.currentUser)) {
      throw new Error('Only admins and moderators can see moderation queue counts');
    }
    const selector = await getNewUserQueueSelector(context);
    // Only the fields needed for classification, and no pagination: the tabs show
    // the whole queue's size, not just the loaded page. getUserReviewGroup batches
    // the moderator action, review history, and offboard-candidate lookups.
    const users = await context.Users.find(selector, {}, { _id: 1, karma: 1 }).fetch();
    const groups = await Promise.all(users.map(user => getUserReviewGroup(context, user)));
    const counts = { newContent: 0, offboard: 0, highContext: 0, maybeSpam: 0, automod: 0, snoozeExpired: 0, unknown: 0 };
    for (const group of groups) counts[group]++;
    return counts;
  },
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
  },
}
