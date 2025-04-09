import { frag } from "@/lib/fragments/fragmentWrapper"

export const UserTagRelDetails = () => gql`
  fragment UserTagRelDetails on UserTagRel {
    _id
    userId
    tagId
    subforumShowUnreadInSidebar
    subforumEmailNotifications
    subforumHideIntroPost
  }
`
