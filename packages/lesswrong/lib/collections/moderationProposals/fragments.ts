import { gql } from "@/lib/generated/gql-codegen";

export const ModerationProposalDisplay = gql(`
  fragment ModerationProposalDisplay on ModerationProposal {
    _id
    createdAt
    targetUserId
    createdByUserId
    createdByUser {
      ...UsersMinimumInfo
    }
    conversationId
    title
    rationale
    steps
    status
    stepResults
    appliedByUserId
    appliedAt
    model
  }
`)
