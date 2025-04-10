import { gql } from "@/lib/generated/gql-codegen/gql";

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
