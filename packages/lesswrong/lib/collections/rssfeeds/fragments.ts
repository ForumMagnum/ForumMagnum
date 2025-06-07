import { gql } from "@/lib/crud/wrapGql";

export const RSSFeedMinimumInfo = gql(`
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
`)

export const newRSSFeedFragment = gql(`
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
`)



export const RSSFeedMutationFragment = gql(`
  fragment RSSFeedMutationFragment on RSSFeed {
    _id
    userId
    ownedByUser
    displayFullContent
    nickname
    url
    importAsDraft
  }
`)
