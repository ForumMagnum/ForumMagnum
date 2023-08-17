import { registerFragment } from "../../vulcan-lib/fragments";

registerFragment(`
  fragment UserTagRelDetails on UserTagRel {
    _id
    userId
    tagId
    subforumShowUnreadInSidebar
    subforumEmailNotifications
    subforumHideIntroPost
  }
`);
