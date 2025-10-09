import { gql } from "@/lib/generated/gql-codegen";

export const InlinePredictions = gql(`
  fragment InlinePredictionsFragment on InlinePrediction {
    _id
    collectionName
    documentId
    quote
    user {
      ...UsersMinimumInfo
    }
    question {
      ...ElicitQuestionFragment
    }
  }
`);
