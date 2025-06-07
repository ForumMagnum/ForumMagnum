import { gql } from "@/lib/crud/wrapGql";

export const SurveyQuestionMinimumInfo = gql(`
  fragment SurveyQuestionMinimumInfo on SurveyQuestion {
    _id
    question
    format
    order
  }
`)
