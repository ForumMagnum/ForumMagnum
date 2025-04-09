import { gql } from "@/lib/generated/gql-codegen/gql";

export const UserMostValuablePostInfo = () => gql(`
  fragment UserMostValuablePostInfo on UserMostValuablePost {
    _id
    userId
    postId
    deleted
  }
`)
