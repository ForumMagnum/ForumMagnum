import { frag } from "@/lib/fragments/fragmentWrapper"

export const UserMostValuablePostInfo = () => gql`
  fragment UserMostValuablePostInfo on UserMostValuablePost {
    _id
    userId
    postId
    deleted
  }
`
