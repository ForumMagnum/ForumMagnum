import { getSetting } from 'meteor/vulcan:core';
import Conversations from "./collection.js";
import { ensureIndex } from '../../collectionUtils';

// will be common to all other view unless specific properties are overwritten
Conversations.addDefaultView(function (terms) {
  const alignmentForum = getSetting('forumType') === 'AlignmentForum' ? {af: true} : {}
  return {
    selector: {
      ...alignmentForum
    },
    options: {limit: 1000},
  };
});

// notifications for a specific user (what you see in the notifications menu)
Conversations.addView("userConversations", function (terms) {
  const showArchivedFilter = terms.showArchive ? {} : {archivedByIds: {$ne: terms.userId}}
  return {
    selector: {participantIds: terms.userId, messageCount: {$gt: 0}, ...showArchivedFilter},
    options: {sort: {latestActivity: -1}}
  };
});
ensureIndex(Conversations, { participantIds: 1, messageCount: 1, latestActivity: -1 })
