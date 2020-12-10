import { ensureIndex } from '../../collectionUtils';
import { forumTypeSetting } from '../../instanceSettings';
import Conversations from "./collection";

declare global {
  interface ConversationsViewTerms extends ViewTermsBase {
    view?: ConversationsViewName
    userId?: string
    showArchive?: boolean
  }
}

// will be common to all other view unless specific properties are overwritten
Conversations.addDefaultView(function (terms: ConversationsViewTerms) {
  const alignmentForum = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}
  return {
    selector: {
      ...alignmentForum
    },
    options: {limit: 1000},
  };
});

// notifications for a specific user (what you see in the notifications menu)
Conversations.addView("userConversations", function (terms: ConversationsViewTerms) {
  const showArchivedFilter = terms.showArchive ? {} : {archivedByIds: {$ne: terms.userId}}
  return {
    selector: {participantIds: terms.userId, messageCount: {$gt: 0}, ...showArchivedFilter},
    options: {sort: {latestActivity: -1}}
  };
});
ensureIndex(Conversations, { participantIds: 1, messageCount: 1, latestActivity: -1 })
