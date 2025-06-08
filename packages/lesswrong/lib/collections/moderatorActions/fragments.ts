import { gql } from "@/lib/crud/wrapGql";

export const ModeratorActionDisplay = gql(`
  fragment ModeratorActionDisplay on ModeratorAction {
    _id
    user {
      ...UsersMinimumInfo
    }
    userId
    type
    active
    createdAt
    endedAt
  }
`)
