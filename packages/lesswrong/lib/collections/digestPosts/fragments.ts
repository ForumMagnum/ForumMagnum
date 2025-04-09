import { frag } from "@/lib/fragments/fragmentWrapper";

export const DigestPostsMinimumInfo = () => gql`
  fragment DigestPostsMinimumInfo on DigestPost {
    _id
    digestId
    postId
    emailDigestStatus
    onsiteDigestStatus
  }
`
