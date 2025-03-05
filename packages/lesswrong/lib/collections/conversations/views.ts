import { isAF } from '../../instanceSettings';
import { viewFieldNullOrMissing } from '@/lib/utils/viewConstants';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ConversationsViewTerms extends ViewTermsBase {
    view?: ConversationsViewName
    userId?: string
    participantIds?: Array<string>
    showArchive?: boolean
    moderator?: boolean
  }
}

// will be common to all other view unless specific properties are overwritten
function defaultView(terms: ConversationsViewTerms) {
  const alignmentForum = isAF ? {af: true} : {}
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
function userConversations(terms: ConversationsViewTerms) {
  const showArchivedFilter = terms.showArchive ? {} : {archivedByIds: {$ne: terms.userId}}
  return {
    selector: {participantIds: terms.userId, messageCount: {$gt: 0}, ...showArchivedFilter},
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
  userGroupUntitledConversations
}, defaultView);
