import { gql } from "@/lib/crud/wrapGql";

export const UserMostValuablePostInfo = gql(`
  fragment UserMostValuablePostInfo on UserMostValuablePost {
    _id
    userId
    postId
    deleted
  }
`)
