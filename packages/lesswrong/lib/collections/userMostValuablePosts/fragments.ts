import { gql } from "@/lib/generated/gql-codegen";

export const UserMostValuablePostInfo = gql(`
  fragment UserMostValuablePostInfo on UserMostValuablePost {
    _id
    userId
    postId
    deleted
  }
`)
