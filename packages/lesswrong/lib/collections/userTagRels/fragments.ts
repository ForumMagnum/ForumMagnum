import { gql } from "@/lib/crud/wrapGql";

export const UserTagRelDetails = gql(`
  fragment UserTagRelDetails on UserTagRel {
    _id
    userId
    tagId
    subforumShowUnreadInSidebar
    subforumEmailNotifications
    subforumHideIntroPost
  }
`)
