import { gql } from "@/lib/generated/gql-codegen";

export const UltraFeedEventCreateMutation = gql(`
  mutation createUltraFeedEvent($data: CreateUltraFeedEventDataInput!) {
    createUltraFeedEvent(data: $data) {
      data {
        _id
      }
    }
  }
`);
