import { frag } from "@/lib/fragments/fragmentWrapper"

export const RSSFeedMinimumInfo = () => frag`
  fragment RSSFeedMinimumInfo on RSSFeed {
    _id
    userId
    user {
      ...UsersMinimumInfo
    }
    createdAt
    ownedByUser
    displayFullContent
    nickname
    url
    importAsDraft
  }
`

export const newRSSFeedFragment = () => frag`
  fragment newRSSFeedFragment on RSSFeed {
    _id
    userId
    createdAt
    ownedByUser
    displayFullContent
    nickname
    url
    status
    importAsDraft
  }
`



export const RSSFeedMutationFragment = () => frag`
  fragment RSSFeedMutationFragment on RSSFeed {
    _id
    userId
    ownedByUser
    displayFullContent
    nickname
    url
    importAsDraft
  }
`
