import { gql } from "@/lib/generated/gql-codegen";

export const ModerationSummaryDisplay = gql(`
  fragment ModerationSummaryDisplay on ModerationSummary {
    _id
    createdAt
    kind
    targetUserId
    memberUserIds
    title
    contents
    createdByUserId
    createdByUser {
      ...UsersMinimumInfo
    }
    conversationId
    model
    deleted
  }
`)
