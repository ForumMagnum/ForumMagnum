import { gql } from "@/lib/generated/gql-codegen";

export const SurveyMinimumInfo = gql(`
  fragment SurveyMinimumInfo on Survey {
    _id
    name
    questions {
      ...SurveyQuestionMinimumInfo
    }
    createdAt
  }
`)
