import { gql } from "@/lib/crud/wrapGql";
export const BansAdminPageFragment = gql(`
  fragment BansAdminPageFragment on Ban {
    _id
    createdAt
    expirationDate
    userId
    user {
      ...UsersMinimumInfo
    }
    reason
    comment
    ip
    properties
  }
`)
