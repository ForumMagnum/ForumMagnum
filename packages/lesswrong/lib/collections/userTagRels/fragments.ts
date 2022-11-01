import { registerFragment } from "../../vulcan-lib/fragments";

registerFragment(`
  fragment UserTagRelNotifications on UserTagRel {
    _id
    userId
    tagId
    subforumShowUnreadInSidebar
    subforumEmailNotifications
  }
`);
