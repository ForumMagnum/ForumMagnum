import { frag } from "@/lib/fragments/fragmentWrapper";

export const DigestPostsMinimumInfo = () => frag`
  fragment DigestPostsMinimumInfo on DigestPost {
    _id
    digestId
    postId
    emailDigestStatus
    onsiteDigestStatus
  }
`
