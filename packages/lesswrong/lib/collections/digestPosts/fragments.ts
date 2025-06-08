import { gql } from "@/lib/crud/wrapGql";

export const DigestPostsMinimumInfo = gql(`
  fragment DigestPostsMinimumInfo on DigestPost {
    _id
    digestId
    postId
    emailDigestStatus
    onsiteDigestStatus
  }
`)
