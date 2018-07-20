import { getSetting } from 'meteor/vulcan:core';
import Conversations from "./collection.js";

// will be common to all other view unless specific properties are overwritten
Conversations.addDefaultView(function (terms) {
  const alignmentForum = getSetting('AlignmentForum', false) ? {af: true} : {}
  return {
    selector: {
      ...alignmentForum
    },
    options: {limit: 1000},
  };
});

// notifications for a specific user (what you see in the notifications menu)
Conversations.addView("userConversations", function (terms) {
  return {
    selector: {participantIds: terms.userId},
    options: {sort: {latestActivity: -1}}
  };
});
