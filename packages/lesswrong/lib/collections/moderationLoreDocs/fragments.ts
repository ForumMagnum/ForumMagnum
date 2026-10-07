import { gql } from "@/lib/generated/gql-codegen";

export const ModerationLoreDocDisplay = gql(`
  fragment ModerationLoreDocDisplay on ModerationLoreDoc {
    _id
    createdAt
    title
    scope
    targetUserId
    targetUser {
      ...UsersMinimumInfo
    }
    userId
    user {
      ...UsersMinimumInfo
    }
    deleted
    contents {
      ...RevisionEdit
    }
  }
`)
