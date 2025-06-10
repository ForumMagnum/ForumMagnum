import { gql } from "@/lib/generated/gql-codegen";

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
