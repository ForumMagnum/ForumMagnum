import type { ApolloClient } from '@apollo/client';
import { viewFieldNullOrMissing } from '@/lib/utils/viewConstants';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';

declare global {
  interface ConversationsViewTerms extends ViewTermsBase {
    view: ConversationsViewName | 'default'
    userId?: string
    participantIds?: Array<string>
    showArchive?: boolean
    moderator?: boolean
  }
}

// will be common to all other view unless specific properties are overwritten
function defaultView(terms: ConversationsViewTerms, _: ApolloClient | undefined, context: ResolverContext) {
  const alignmentForum = context.forumType === 'AlignmentForum' ? {af: true} : {}
  return {
    selector: {
      ...alignmentForum
    },
    options: {limit: 1000},
  };
}

// notifications for the site moderation team
function moderatorConversations(terms: ConversationsViewTerms) {
  const participantIds = terms.userId ? {participantIds: terms.userId} : {}
  const showArchivedFilter = terms.showArchive ? {} : {archivedByIds: {$ne: terms.userId}}
  return {
    selector: {moderator: true, messageCount: {$gt: 0}, ...showArchivedFilter, ...participantIds},
    options: {sort: {latestActivity: -1}}
  };
}

// notifications for a specific user (what you see in the notifications menu)
function userConversations(terms: ConversationsViewTerms, _: ApolloClient | undefined, context: ResolverContext) {
  const showArchivedFilter = terms.showArchive ? {} : {archivedByIds: {$ne: terms.userId}}
  // Moderator conversations (such as rejection messages) belong in the moderation inbox
  // for moderators, but should still appear in the normal inbox of the users they were sent to.
  const isModeratorViewingOwnInbox = !!context.currentUser
    && context.currentUser._id === terms.userId
    && userIsAdminOrMod(context.currentUser);
  const moderatorSelector = (context.forumType === 'LessWrong' && isModeratorViewingOwnInbox) ? {moderator: {$ne: true}} : {}
  return {
    selector: {participantIds: terms.userId, messageCount: {$gt: 0}, ...showArchivedFilter, ...moderatorSelector},
    options: {sort: {latestActivity: -1}}
  };
}

function userConversationsAll(terms: ConversationsViewTerms) {
  const showArchivedFilter = terms.showArchive ? {} : {archivedByIds: {$ne: terms.userId}}
  return {
    selector: {participantIds: terms.userId, ...showArchivedFilter},
    options: {sort: {latestActivity: -1}}
  };
}

// Moderator conversations waiting on a moderator, longest-waiting first
function teamInboxAwaitingReply(terms: ConversationsViewTerms) {
  return {
    selector: {moderator: true, awaitingModeratorReply: true},
    options: {sort: {latestActivity: 1}}
  };
}

// Moderator conversations that have been replied to or marked done
function teamInboxDone(terms: ConversationsViewTerms) {
  return {
    selector: {moderator: true, awaitingModeratorReply: {$ne: true}, messageCount: {$gt: 0}},
    options: {sort: {latestActivity: -1}}
  };
}

function userGroupUntitledConversations(terms: ConversationsViewTerms) {
  const moderatorSelector = terms.moderator ? {moderator: true} : {}

  // returns a list of conversations where the participant list is exactly terms.participantIds
  return {
    selector: {
      participantIds: terms.participantIds
        ? { $size: terms.participantIds.length, $all: terms.participantIds }
        : terms.userId,
      title: viewFieldNullOrMissing,
      // pass in a terms.userId to exclude conversations that this user archived
      archivedByIds: { $ne: terms.userId },
      ...moderatorSelector,
    },
    // Prefer non-mod conversations
    options: { sort: { moderator: 1 } },
  };
}

export const ConversationsViews = new CollectionViewSet('Conversations', {
  moderatorConversations,
  userConversations,
  userConversationsAll,
  teamInboxAwaitingReply,
  teamInboxDone,
  userGroupUntitledConversations
}, defaultView);
