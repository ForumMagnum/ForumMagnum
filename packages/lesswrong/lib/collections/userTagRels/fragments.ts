import { frag } from "@/lib/fragments/fragmentWrapper"

export const UserTagRelDetails = () => frag`
  fragment UserTagRelDetails on UserTagRel {
    _id
    userId
    tagId
    subforumShowUnreadInSidebar
    subforumEmailNotifications
    subforumHideIntroPost
  }
`
