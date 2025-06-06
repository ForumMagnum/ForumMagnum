import { gql } from "@/lib/crud/wrapGql";

export const TypingIndicatorInfo = gql(`
  fragment TypingIndicatorInfo on TypingIndicator {
    _id
    userId
    documentId
    lastUpdated
  }
`)
