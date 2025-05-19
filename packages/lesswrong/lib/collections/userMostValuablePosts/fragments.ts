import { frag } from "@/lib/fragments/fragmentWrapper"

export const UserMostValuablePostInfo = () => frag`
  fragment UserMostValuablePostInfo on UserMostValuablePost {
    _id
    userId
    postId
    deleted
  }
`
