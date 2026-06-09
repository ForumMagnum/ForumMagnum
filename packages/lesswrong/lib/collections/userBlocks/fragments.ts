import { gql } from "@/lib/generated/gql-codegen";

export const UserBlockFragment = gql(`
  fragment UserBlockFragment on UserBlock {
    _id
    userId
    blockedUserId
    blocked
  }
`);
