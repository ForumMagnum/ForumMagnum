import { gql } from "@/lib/generated/gql-codegen";

export const DigestPostsMinimumInfo = gql(`
  fragment DigestPostsMinimumInfo on DigestPost {
    _id
    digestId
    postId
    emailDigestStatus
    onsiteDigestStatus
  }
`)
