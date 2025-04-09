import { gql } from "@/lib/generated/gql-codegen/gql";

export const DigestPostsMinimumInfo = () => gql(`
  fragment DigestPostsMinimumInfo on DigestPost {
    _id
    digestId
    postId
    emailDigestStatus
    onsiteDigestStatus
  }
`)
