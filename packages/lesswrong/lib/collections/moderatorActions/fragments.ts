import { gql } from "@/lib/generated/gql-codegen";

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
