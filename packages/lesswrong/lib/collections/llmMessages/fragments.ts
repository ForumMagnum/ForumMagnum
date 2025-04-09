import { frag } from "@/lib/fragments/fragmentWrapper";

export const LlmMessagesFragment = () => gql`
  fragment LlmMessagesFragment on LlmMessage {
    _id
    userId
    conversationId
    role
    content
    createdAt
  }
`
