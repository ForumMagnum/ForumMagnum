import { gql } from "@/lib/crud/wrapGql";

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
