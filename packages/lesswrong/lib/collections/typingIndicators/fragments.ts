import { frag } from "@/lib/fragments/fragmentWrapper"

export const TypingIndicatorInfo = () => gql`
  fragment TypingIndicatorInfo on TypingIndicator {
    _id
    userId
    documentId
    lastUpdated
  }
`
