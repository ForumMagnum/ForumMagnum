import { frag } from "@/lib/fragments/fragmentWrapper"

export const TypingIndicatorInfo = () => frag`
  fragment TypingIndicatorInfo on TypingIndicator {
    _id
    userId
    documentId
    lastUpdated
  }
`
